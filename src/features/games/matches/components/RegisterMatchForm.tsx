import { useUnsavedChanges } from "@/src/shared/hooks/useUnsavedChanges";
import ScreenHeader from "@/src/components/navigation/ScreenHeader";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import DialogSurface from "@/src/components/ui/DialogSurface";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  ActivityIndicator, Image, Platform, StyleSheet, ScrollView, Modal,
  KeyboardAvoidingView, Keyboard,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";

import { useRegisterMatch } from "../hooks/useRegisterMatch";
import matchService from "../services/matchService";
import sessionService from "../../sessions/services/sessionService";
import { toMatchPlayerDto } from "../../../users/utils/playerMappers";
import { GameSelector } from "../../catalog/components/GameSelector";
import { ExpansionSelector } from "../../catalog/components/ExpansionSelector";
import PlayerSelector from "../../../users/components/PlayerSelector";
import MatchRatingField from "./MatchRatingField";

import { Game } from "../../catalog/types/Game";
import { useRouter } from "expo-router";
import MatchSummary from "./MatchSummary";
import GameCover from "./GameCover";
import MatchResultFields from "./MatchResultFields";
import { hasCompleteScores } from "../utils/registrationScores";
import MatchDateFields from "./MatchDateFields";
import { initialSessionMatchDate } from "../utils/registrationDate";
import { MatchDto, MatchFormData, MatchOutcome } from "../types/MatchForm";
import { PlayerState } from "../../../users/types/PlayerState";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import { useFriends } from "../../../friends/hooks/useFriends";
import { GameSession } from "../../sessions/types/GameSession";
import { sessionPlayerGuards } from "../../sessions/types/GameSessionPlayer";
import { User } from "../../../users/types/User";
import {
  getAvailableModes, getDefaultMode,
  GameMode, AvailableModes,
} from "../../catalog/types/GameSuggestion";

type SoloResult = "player_win" | "game_win" | "draw" | "none";

type Props = {
  sessionId?: string;
  currentUser?: { id: string; userName: string };
  disableScroll?: boolean;
  onRegistered?: () => void;
};

type Step = 0 | 1 | 2 | 3;

export default function RegisterMatchForm({ sessionId, currentUser, disableScroll = false, onRegistered }: Props) {
  const { t, i18n } = useTranslation("matches");
  const scrollRef = useRef<ScrollView>(null);
  const isSessionMatch = !!sessionId;

  const steps = useMemo(
    () => [
      t("steps.game"),
      t("steps.players"),
      t("steps.result"),
      t("steps.review"),
    ],
    [t]
  );

  const locale = i18n.resolvedLanguage === "pt" ? "pt-PT" : "en-GB";

  const getModeLabel = (mode: GameMode): string => {
    if (mode === "solo") return t("modes.solo");
    if (mode === "cooperative") return t("modes.cooperative");
    return t("modes.multiplayer");
  };

  const getSoloResultLabel = (result: SoloResult): string => {
    if (result === "player_win") return `🏆 ${t("modes.playerWon")}`;
    if (result === "game_win") return `💀 ${t("modes.gameWon")}`;
    return `— ${t("modes.noResult")}`;
  };

  const { submitMatch, loading, error } = useRegisterMatch();
  const { friends, loading: friendsLoading } = useFriends();

  const [session, setSession] = useState<GameSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [step, setStep] = useState<Step>(0);
  useEffect(() => {
    Keyboard.dismiss();
    setDatePicker(null);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);

  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [editingGame, setEditingGame] = useState(true);
  const [selectedExpansions, setSelectedExpansions] = useState<Game[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>("multiplayer");
  const [soloResult, setSoloResult] = useState<SoloResult>("none");
  const [playerState, setPlayerState] = useState<PlayerState[]>([]);
  const multiplayerDraft = useRef<PlayerState[]>([]);
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState("");
  const [comments, setComments] = useState("");

  const [personalRating, setPersonalRating] = useState<number | undefined>();
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const MAX_PHOTOS = 5;
  const router = useRouter();
  const [savedMatch, setSavedMatch] = useState<MatchDto | null>(null);
  const [failedPhotos, setFailedPhotos] = useState<string[]>([]);
  const submittedMatch = useRef<MatchDto | null>(savedMatch);
  const submitting = useRef(false);
  const photoBusy = useRef(false);
  const navigationGuard = useUnsavedChanges(!savedMatch && (!!selectedGame || !!location || !!duration || !!comments || personalRating !== undefined || !!notes || !!tags || pendingPhotos.length > 0), loading || uploadingPhotos, sessionId ? `/games/sessions/${sessionId}` : undefined);

  const [unofficialMode, setUnofficialMode] = useState<GameMode | null>(null);
  const [unofficialJustification, setUnofficialJustification] = useState("");
  const [showUnofficialModal, setShowUnofficialModal] = useState(false);
  const [pendingUnofficialMode, setPendingUnofficialMode] = useState<GameMode | null>(null);
  const [scoresEnabled, setScoresEnabled] = useState(false);
  const [matchDate, setMatchDate] = useState(() => new Date());
  const [datePicker, setDatePicker] = useState<"date" | "time" | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showResultErrors, setShowResultErrors] = useState(false);
  const [teamResult, setTeamResult] = useState<"win" | "loss" | "draw" | null>(null);
  const [competitiveResult, setCompetitiveResult] = useState<"Win" | "Draw" | "Undefined">("Win");
  const [sharedVictoryAllowed, setSharedVictoryAllowed] = useState(false);
  const initializedSessionDate = useRef<string | null>(null);
  const matchDateEdited = useRef(false);

  useEffect(() => {
    let mounted = true;
    async function loadSession() {
      if (!sessionId) { setSession(null); return; }
      try {
        setSessionLoading(true);
        const data = await sessionService.getById(sessionId);
        if (mounted) {
          setSession(data);
          if (data && initializedSessionDate.current !== sessionId && !matchDateEdited.current) {
            setMatchDate(current => initialSessionMatchDate(data, current));
            initializedSessionDate.current = sessionId;
          }
        }
      } catch { if (mounted) setSession(null); }
      finally { if (mounted) setSessionLoading(false); }
    }
    loadSession();
    return () => { mounted = false; };
  }, [sessionId]);

  const sessionIsActive = session?.status === "Active";

  const acceptedUsersFromSession: User[] = useMemo(() => {
    return (session?.players ?? [])
      .filter(sessionPlayerGuards.isAccepted)
      .map((p) => ({ id: p.userId, userName: p.userName } as User));
  }, [session]);

  const availableUsers: User[] = useMemo(() => {
    if (isSessionMatch) return acceptedUsersFromSession;
    return friends ?? [];
  }, [isSessionMatch, acceptedUsersFromSession, friends]);

  const currentUserForSelector = useMemo(() => {
    if (!currentUser?.id) return undefined;
    if (!isSessionMatch) return currentUser;
    const isAccepted = acceptedUsersFromSession.some((u) => u.id === currentUser.id);
    return isAccepted ? currentUser : undefined;
  }, [currentUser, isSessionMatch, acceptedUsersFromSession]);

  const availableModes = useMemo((): AvailableModes => {
    if (!selectedGame) return {
      solo:        { available: true,  source: null, label: t("modes.solo"),        icon: "person"   },
      multiplayer: { available: true,  source: null, label: t("modes.multiplayer"), icon: "people"   },
      cooperative: { available: false, source: null, label: t("modes.cooperative"), icon: "favorite" },
    };
    const expansion = selectedExpansions[0] ?? null;
    return getAvailableModes(selectedGame, expansion);
  }, [selectedGame, selectedExpansions, t]);

  useEffect(() => {
    if (!selectedGame) return;
    const expansion = selectedExpansions[0] ?? null;
    const best = getDefaultMode(selectedGame, expansion);
    setGameMode(isSessionMatch && best === "solo" ? "multiplayer" : best);
    setUnofficialMode(null);
    setUnofficialJustification("");
    setSoloResult("none");
    setTeamResult(null);
  }, [selectedGame?.id, selectedExpansions]);

  const isSolo = gameMode === "solo";
  const isCooperative = gameMode === "cooperative";
  const result: MatchOutcome = isSolo ? soloResult === "player_win" ? "Win" : soloResult === "game_win" ? "Loss" : soloResult === "draw" ? "Draw" : "Undefined"
    : isCooperative ? teamResult === "win" ? "Win" : teamResult === "loss" ? "Loss" : teamResult === "draw" ? "Draw" : "Undefined" : competitiveResult;
  const resultPlayerIds = !isSolo && !isCooperative && result !== "Undefined" ? playerState.filter(p => p.isWinner).map(p => p.id) : [];
  const outcomeFor = (id: string): MatchOutcome => isSolo || isCooperative || result === "Undefined" ? result : resultPlayerIds.includes(id) ? result : "Loss";
  const isUnofficial = unofficialMode === gameMode;

  useEffect(() => {
    if (isSolo && currentUser?.id) {
      setPlayerState(prev => {
        if (prev.length > 1) multiplayerDraft.current = prev;
        return [{ id: currentUser.id, username: currentUser.userName, score: prev.find(p => p.id === currentUser.id)?.score ?? "", isWinner: false }];
      });
    } else if (multiplayerDraft.current.length) {
      const draft = multiplayerDraft.current;
      multiplayerDraft.current = [];
      setPlayerState(prev => draft.map(p => ({ ...p, isWinner: false,
        score: p.id === currentUser?.id ? prev.find(player => player.id === p.id)?.score ?? p.score : p.score })));
    }
  }, [isSolo, currentUser?.id, currentUser?.userName]);

  const handleModePress = (mode: GameMode) => {
    if (isSessionMatch && mode === "solo") return;
    const info = availableModes[mode];
    if (info.available) {
      if (mode !== gameMode) { setPlayerState(prev => prev.map(p => ({ ...p, isWinner: false }))); setTeamResult(null); }
      setGameMode(mode);
      setUnofficialMode(null);
      setUnofficialJustification("");
    } else {
      setPendingUnofficialMode(mode);
      setUnofficialJustification("");
      setShowUnofficialModal(true);
    }
  };

  const handleConfirmUnofficial = () => {
    if (!pendingUnofficialMode || (isSessionMatch && pendingUnofficialMode === "solo") || unofficialJustification.trim().length < 5) return;
    if (pendingUnofficialMode !== gameMode) { setPlayerState(prev => prev.map(p => ({ ...p, isWinner: false }))); setTeamResult(null); }
    setGameMode(pendingUnofficialMode);
    setUnofficialMode(pendingUnofficialMode);
    setShowUnofficialModal(false);
    setPendingUnofficialMode(null);
  };

  const handleCancelUnofficial = () => {
    setShowUnofficialModal(false);
    setPendingUnofficialMode(null);
    setUnofficialJustification("");
  };

  const participantsValid = !(isSessionMatch && isSolo) && (isSolo ? new Set(playerState.map(p => p.id).filter(Boolean)).size === 1 : new Set(playerState.map(p => p.id).filter(Boolean)).size >= 2);
  const validateParticipants = () => {
    if (participantsValid) return true;
    Alert.alert(t("validation.errorTitle"), t(isSessionMatch && isSolo ? "form.sessionNoSolo" : "form.twoPlayers"));
    return false;
  };
  const canGoNext = (): boolean => {
    if (step === 0) return !!selectedGame && !editingGame;
    if (step === 1 || step === 2) return playerState.length > 0;
    return true;
  };

  const validateResult = (): boolean => {
    setShowResultErrors(true);
    if (!validateParticipants()) return false;
    if (personalRating === undefined || !Number.isFinite(personalRating) || personalRating < 0 || personalRating > 10 || !Number.isInteger(personalRating * 2)) {
      Alert.alert(t("validation.errorTitle"), t("form.ratingRequired")); return false;
    }
    if (!hasCompleteScores(playerState, scoresEnabled)) return false;
    if (!isSolo && !isCooperative && result !== "Undefined") {
      if (resultPlayerIds.length < (result === "Draw" ? 2 : 1) || (result === "Win" && resultPlayerIds.length > 1 && !sharedVictoryAllowed)) {
        Alert.alert(t("validation.errorTitle"), t(result === "Draw" ? "outcomes.twoDrawPlayers" : "validation.selectWinner")); return false;
      }
    }
    if (!Number.isFinite(matchDate.getTime()) || matchDate.getTime() > Date.now() + 60000) {
      Alert.alert(t("validation.errorTitle"), t("form.dateInvalid")); return false;
    }
    const dur = duration.trim() ? Number(duration) : undefined;
    if (dur !== undefined && (!/^\d+$/.test(duration.trim()) || !Number.isInteger(dur) || dur <= 0 || dur > 2147483647)) {
      setShowDetails(true);
      Alert.alert(t("validation.errorTitle"), t("validation.positiveDuration")); return false;
    }
    return true;
  };
  const goNext = () => {
    if (step === 1 && !validateParticipants()) return;
    if (step === 2 && !validateResult()) return;
    if (step < 3 && canGoNext()) setStep((s) => (s + 1) as Step);
  };
  const goPrev = () => { if (step > 0) setStep((s) => (s - 1) as Step); };

  const handlePickPendingPhoto = async () => {
    if (pendingPhotos.length >= MAX_PHOTOS) {
      Alert.alert(t("validation.errorTitle"), t("photos.limit", { count: MAX_PHOTOS }));
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("photos.permissionTitle"), t("photos.permission"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setPendingPhotos((prev) => [...prev, result.assets[0].uri]);
  };

  const handleRemovePendingPhoto = (uri: string) => {
    setPendingPhotos((prev) => prev.filter((p) => p !== uri));
  };

  const clearAll = () => {
    submittedMatch.current = null;
    multiplayerDraft.current = [];
    matchDateEdited.current = false;
    initializedSessionDate.current = null;
    navigationGuard.markUnsaved();
    setSelectedGame(null); setSelectedExpansions([]); setPlayerState([]);
    setLocation(""); setDuration(""); setComments("");
    setPersonalRating(undefined); setNotes(""); setTags(""); setPendingPhotos([]);
    setUnofficialMode(null); setUnofficialJustification("");
    setSavedMatch(null); setFailedPhotos([]); setScoresEnabled(false);
    setMatchDate(isSessionMatch && session ? initialSessionMatchDate(session, new Date()) : new Date());
    setCompetitiveResult("Win"); setSharedVictoryAllowed(false);
    setShowDetails(false); setShowResultErrors(false); setDatePicker(null); setTeamResult(null);
    setEditingGame(true); setGameMode("multiplayer"); setSoloResult("none"); setStep(0);
  };

  const handleSubmit = async () => {
    if (submittedMatch.current || submitting.current) return;
    if (!selectedGame) return Alert.alert(t("validation.errorTitle"), t("validation.selectGame"));
    if (playerState.length === 0) return Alert.alert(t("validation.errorTitle"), t("validation.addPlayer"));

    if (currentUserForSelector && !playerState.some(p => p.id === currentUserForSelector.id))
      return Alert.alert(t("validation.errorTitle"), t("selector.participationRequired"));
    if (!validateParticipants()) { setStep(1); return; }
    if (!validateResult()) {
      setStep(2);
      return;
    }
    const dur = duration.trim() ? Number(duration) : undefined;

    const winnerId = result === "Win" && !isCooperative ? isSolo ? currentUser?.id : resultPlayerIds.length === 1 ? resultPlayerIds[0] : undefined : undefined;

    let players: MatchFormData["players"];
    try {
      players = toMatchPlayerDto(scoresEnabled ? playerState : playerState.map(p => ({ ...p, score: "" })));
    } catch (error) {
      return Alert.alert(t("validation.errorTitle"), (error as Error).message);
    }

    const payload: MatchFormData = {
      gameId: selectedGame.id,
      gameName: selectedGame.name,
      matchDate: matchDate.toISOString(),
      scoresEnabled,
      location: location.trim() || undefined,
      durationInMinutes: dur,
      scoreSummary: comments.trim() || undefined,
      isSoloGame: isSolo,
      gameMode: isSolo ? "SOLO" : isCooperative ? "COOPERATIVE" : "COMPETITIVE",
      result,
      resultPlayerIds,
      sharedVictoryAllowed: !isSolo && !isCooperative && result === "Win" && sharedVictoryAllowed,
      players: players.map(p => ({ ...p, isWinner: outcomeFor(p.userId) === "Win", outcome: outcomeFor(p.userId) })),
      winnerId,
      expansions: selectedExpansions.map((e) => ({ bggId: e.bggId!, name: e.name })),
      sessionId: sessionId || undefined,
      personalRating,
      notes: notes.trim() || undefined,
      tags: tags.trim() || undefined,
      unofficialModeJustification: isUnofficial ? unofficialJustification : undefined,
    };

    submitting.current = true;
    try {
      const created = await submitMatch(payload);
      if (!created) return;
      submittedMatch.current = created;
      setSavedMatch(created);
      const failed: string[] = [];
      setUploadingPhotos(true);
      try {
        for (const uri of pendingPhotos) {
          try { await matchService.uploadJournalPhoto(created.id, uri); }
          catch { failed.push(uri); }
        }
      } finally { setUploadingPhotos(false); }
      setFailedPhotos(failed);
      navigationGuard.allowExit();
    } finally { submitting.current = false; }
  };

  const retryPhotos = async () => {
    if (!submittedMatch.current || photoBusy.current || uploadingPhotos) return;
    photoBusy.current = true;
    navigationGuard.markUnsaved();
    setUploadingPhotos(true);
    const remaining: string[] = [];
    try {
      for (const uri of failedPhotos) {
        try { await matchService.uploadJournalPhoto(submittedMatch.current.id, uri); }
        catch { remaining.push(uri); }
      }
      setFailedPhotos(remaining);
    } finally { photoBusy.current = false; setUploadingPhotos(false); navigationGuard.allowExit(); }
  };

  const returnToSession = () => {
    if (uploadingPhotos || photoBusy.current) return;
    if (onRegistered) onRegistered();
    else if (sessionId) router.dismissTo({ pathname: "/games/sessions/[id]", params: { id: sessionId } });
  };

  if (savedMatch) return <View style={{ flex: 1, backgroundColor: COLORS.background }}>
    <ScreenHeader title={t("success.savedTitle")} appearance="refresh" subtitle={session?.name}
      onLeftPress={isSessionMatch ? returnToSession : navigationGuard.cancel} />
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={{ gap: 16 }}>
        <MatchSummary match={savedMatch} />
        {uploadingPhotos && <Text style={styles.hint}>{t("photos.uploading")}</Text>}
        {!uploadingPhotos && failedPhotos.length > 0 && <View style={{ gap: 8 }}>
          <Text style={styles.hint}>{t("success.photosFailed", { count: failedPhotos.length })}</Text>
          <PrimaryButton title={t("success.retryPhotos")} variant="secondary" onPress={retryPhotos} />
        </View>}
        <PrimaryButton title={t(isSessionMatch ? "sessions.backToSession" : "form.newMatch")} disabled={uploadingPhotos}
          onPress={isSessionMatch ? returnToSession : () => { if (onRegistered) onRegistered(); else clearAll(); }} />
        <PrimaryButton title={t("success.viewMatch")} variant="secondary" disabled={uploadingPhotos}
          onPress={() => router.push({ pathname: "/games/matches/[id]", params: { id: savedMatch.id, originSessionId: sessionId } })} />
      </View>
    </ScrollView>
  </View>;

  if (isSessionMatch && sessionLoading)
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  if (isSessionMatch && !sessionLoading && !session)
    return (
      <View style={styles.noticeDanger}>
        <Text style={styles.noticeTitle}>{t("session.notFoundTitle")}</Text>
        <Text style={styles.noticeText}>{t("session.notFoundDescription")}</Text>
      </View>
    );

  if (isSessionMatch && session && !sessionIsActive) {
    const when = session.scheduledStartDate ? new Date(session.scheduledStartDate).toLocaleString(locale) : "—";
    return (
      <View style={styles.noticeWarn}>
        <Text style={styles.noticeTitle}>
          {session.status === "Upcoming" ? t("session.upcomingTitle") : t("session.closedTitle")}
        </Text>
        <Text style={styles.noticeText}>🗓 {when}</Text>
        <Text style={styles.noticeText}>{t("session.inactiveDescription")}</Text>
      </View>
    );
  }

  if (isSessionMatch && session && (acceptedUsersFromSession.length === 0 || !currentUserForSelector))
    return (
      <View style={styles.noticeWarn}>
        <Text style={styles.noticeTitle}>{t(currentUserForSelector ? "session.noAcceptedTitle" : "session.notEligibleTitle")}</Text>
        <Text style={styles.noticeText}>{t(currentUserForSelector ? "session.noAcceptedDescription" : "session.notEligibleDescription")}</Text>
      </View>
    );

  const footer = (
    <View style={disableScroll ? styles.navRowInline : styles.stickyBar}>
      <View style={styles.navRow}>
        {step > 0 && <View style={{ flex: 1, minWidth: 100 }}>
          <PrimaryButton title={t("navigation.back")} variant="secondary" onPress={goPrev} />
        </View>}
        <View style={{ flex: 2, minWidth: 140 }}>
          {step < 3 ? (
            <PrimaryButton title={t(step === 2 ? "navigation.review" : "navigation.continue")} onPress={goNext} disabled={!canGoNext()} />
          ) : (
            <PrimaryButton title={uploadingPhotos ? t("photos.uploading") : t("navigation.save")}
              onPress={handleSubmit} loading={loading || uploadingPhotos} />
          )}
        </View>
      </View>
    </View>
  );

  const content = (
    <View style={{ backgroundColor: COLORS.background }}>
      {!disableScroll && <ScreenHeader mode="cancel" appearance="refresh" title={t("header.registerMatch")} subtitle={session?.name} onLeftPress={navigationGuard.cancel} />}
      {/* Header */}
      <View style={styles.header}>
        {disableScroll && <PrimaryButton title={i18n.t("navigation:cancel")} variant="secondary" onPress={() => navigationGuard.discard(clearAll)} />}
        {disableScroll && <Text style={styles.title}>
          {isSessionMatch ? t("header.addMatch") : t("header.registerMatch")}
        </Text>}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, isSessionMatch ? styles.badgeSession : styles.badgeQuick]}>
            <Text style={[styles.badgeText, isSessionMatch ? styles.badgeSessionText : styles.badgeQuickText]}>
              {isSessionMatch ? t("header.sessionBadge") : t("header.quickBadge")}
            </Text>
          </View>
          {isUnofficial && (
            <View style={styles.unofficialBadge}>
              <Text style={styles.unofficialBadgeText}>{t("header.unofficialBadge")}</Text>
            </View>
          )}
        </View>
      </View>

      {selectedGame && <View style={styles.gameRow}>
        <GameCover uri={selectedGame.imageUrl} size={64} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.gameName}>{selectedGame.name}</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("form.edit", { section: t("summary.mode") })} onPress={() => setStep(0)} style={styles.modeLink}>
            <Text style={styles.gameMeta}>{getModeLabel(gameMode)} · {t("game.change")}</Text>
          </TouchableOpacity>
        </View>
      </View>}
      <ProgressBar current={step} total={steps.length} labels={steps} />

      {/* ══ STEP 0: Jogo ══ */}
      {step === 0 && (
        <View style={styles.card}>
          <SectionTitle icon="sports-esports" label={t("game.sectionTitle")} />
          {editingGame ? (
            <GameSelector appearance="refresh" onSelect={(game) => { setSelectedGame(game); setSelectedExpansions([]); setEditingGame(false); }} />
          ) : (
            <View>
              <PrimaryButton title={t("game.change")} variant="secondary" onPress={() => setEditingGame(true)} />
              {selectedGame && (
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.subLabel}>{t("game.expansionsOptional")}</Text>
                  <ExpansionSelector appearance="refresh" baseGameId={selectedGame.id} selectedExpansions={selectedExpansions} onChange={setSelectedExpansions} />
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Modo acessível junto do jogo, sem etapa própria. */}
      {step === 0 && selectedGame && !editingGame && (
        <View style={styles.card}>
          <SectionTitle icon="gamepad" label={t("modes.sectionTitle")} />
          {isSessionMatch && <Text style={styles.hint}>{t("form.sessionNoSolo")}</Text>}
          <View style={styles.modeRow}>
            {([
              { mode: "solo" as GameMode,        icon: "person",   label: t("modes.solo"),        color: COLORS.success   },
              { mode: "multiplayer" as GameMode, icon: "people",   label: t("modes.multiplayer"), color: COLORS.primary   },
              { mode: "cooperative" as GameMode, icon: "favorite", label: t("modes.cooperative"), color: COLORS.secondary },
            ]).map(({ mode, icon, label, color }) => {
              const info = availableModes[mode];
              const blockedSolo = isSessionMatch && mode === "solo";
              const isActive = gameMode === mode;
              const isActiveUnofficial = isActive && unofficialMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeBtn, isActive && { borderColor: color, backgroundColor: color + "18" }, (!info.available || blockedSolo) && styles.modeBtnUnavailable]}
                  disabled={blockedSolo}
                  onPress={() => handleModePress(mode)} activeOpacity={0.8}
                  accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ selected: isActive, disabled: blockedSolo }}
                >
                  <MaterialIcons name={icon as any} size={24} color={isActive ? color : COLORS.textMuted} />
                  <Text style={[styles.modeBtnLabel, isActive && { color }, (!info.available || blockedSolo) && { color: COLORS.textMuted }]}>{label}</Text>
                  {!blockedSolo && info.available && info.source && (
                    <View style={[styles.sourceBadge, info.source === "bgg_official" && styles.sourceBadgeOfficial, info.source === "expansion" && styles.sourceBadgeExpansion]}>
                      <Text style={[styles.sourceBadgeText, info.source === "bgg_official" && { color: COLORS.success }, info.source === "expansion" && { color: "#1E88E5" }]}>
                        {info.source === "bgg_official" ? t("modes.confirmed") : t("modes.expansionShort")}
                      </Text>
                    </View>
                  )}
                  {!blockedSolo && !info.available && <View style={styles.forceBadge}><Text style={styles.forceBadgeText}>{t("modes.force")}</Text></View>}
                  {isActiveUnofficial && <View style={styles.unofficialSmallBadge}><Text style={styles.unofficialSmallBadgeText}>⚠️</Text></View>}
                </TouchableOpacity>
              );
            })}
          </View>

          {isUnofficial && (
            <View style={styles.unofficialWarning}>
              <MaterialIcons name="warning" size={14} color="#f39c12" />
              <Text style={styles.unofficialWarningText}>
                {t("modes.unofficialWarning", { justification: unofficialJustification })}
              </Text>
            </View>
          )}

          <Modal visible={showUnofficialModal} transparent animationType="fade">
            <DialogSurface>
                <Text style={styles.modalTitle}>{t("modes.modalTitle")}</Text>
                <Text style={styles.modalDesc}>
                  {t("modes.modalBeforeMode")}
                  <Text style={{ fontWeight: "800" }}>
                    {pendingUnofficialMode ? getModeLabel(pendingUnofficialMode) : ""}
                  </Text>{t("modes.modalAfterMode")}
                  <Text style={{ fontWeight: "800", color: COLORS.error }}>
                    {t("modes.modalRankingWarning")}
                  </Text>
                </Text>
                <Text style={styles.modalLabel}>{t("modes.reasonLabel")}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={unofficialJustification}
                  onChangeText={setUnofficialJustification}
                  accessibilityLabel={t("modes.reasonLabel")}
                  placeholder={t("modes.reasonPlaceholder")}
                  placeholderTextColor={COLORS.textMuted}
                  multiline numberOfLines={3}
                  textAlignVertical="top"
                  maxLength={200}
                />
                <Text style={styles.modalHint}>{unofficialJustification.length}/200</Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={handleCancelUnofficial}>
                    <Text style={styles.modalCancelText}>{t("modes.cancel")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalConfirmBtn, unofficialJustification.trim().length < 5 && { opacity: 0.4 }]}
                    onPress={handleConfirmUnofficial}
                    disabled={unofficialJustification.trim().length < 5}
                  >
                    <Text style={styles.modalConfirmText}>{t("modes.useAnyway")}</Text>
                  </TouchableOpacity>
                </View>
            </DialogSurface>
          </Modal>
        </View>
      )}

      {/* ══ STEP 1: Jogadores ══ */}
      {step === 1 && <View style={styles.card}>
        {!participantsValid && <View style={{ gap: 8, marginBottom: 12 }}>
          <Text style={styles.hint}>{t("form.twoPlayers")}</Text>
          <Text style={styles.hint}>{t(isSessionMatch ? "form.sessionPlayersHint" : "form.quickPlayersHint")}</Text>
          {!isSessionMatch && <TouchableOpacity style={styles.detailsToggle} accessibilityRole="button" onPress={() => setStep(0)}>
            <Text style={styles.detailsToggleText}>{t("form.changeMode")}</Text>
          </TouchableOpacity>}
        </View>}
        {isSolo ? <View style={styles.soloPlayerRow}>
          <Text style={styles.playerName}>{currentUser?.userName ?? t("players.you")}</Text>
          <Text style={styles.hint}>{t("selector.participationRequired")}</Text>
        </View> : !isSessionMatch && friendsLoading ? <ActivityIndicator color={COLORS.primary} /> :
          <PlayerSelector title={t("steps.players")} users={availableUsers} players={playerState} onChange={setPlayerState}
            currentUser={currentUserForSelector} lockCurrentUser selectionOnly
            mode={isSessionMatch ? "session" : "quick"} maxResults={12} />}
      </View>}

      {/* ══ STEP 2: Resultado e detalhes antes da revisão ══ */}
      {step === 2 && (
        <View>
          <View style={styles.card}>
            <SectionTitle icon="emoji-events" label={t("steps.result")} />
            <View style={styles.resultRow}>
              {(isSolo || isCooperative ? ["Win", "Loss", "Draw", "Undefined"] : ["Win", "Draw", "Undefined"]).map(value => <ResultButton key={value} emoji={value === "Win" ? "🏆" : value === "Loss" ? "—" : value === "Draw" ? "=" : "?"}
                label={t(isCooperative ? `outcomes.team${value}` : `outcomes.${value}`)} active={result === value} activeColor={COLORS.primary}
                onPress={() => {
                  if (isSolo) setSoloResult(value === "Win" ? "player_win" : value === "Loss" ? "game_win" : value === "Draw" ? "draw" : "none");
                  else if (isCooperative) setTeamResult(value === "Win" ? "win" : value === "Loss" ? "loss" : value === "Draw" ? "draw" : null);
                  else { setCompetitiveResult(value as "Win" | "Draw" | "Undefined"); setPlayerState(prev => prev.map(p => ({ ...p, isWinner: false }))); }
                }} />)}
            </View>
            {!isSolo && !isCooperative && result === "Win" && <TouchableOpacity style={styles.detailsToggle} accessibilityRole="checkbox"
              accessibilityState={{ checked: sharedVictoryAllowed }} onPress={() => {
                setSharedVictoryAllowed(value => !value);
                if (sharedVictoryAllowed && playerState.filter(p => p.isWinner).length > 1) setPlayerState(prev => prev.map(p => ({ ...p, isWinner: false })));
              }}>
              <Text style={styles.detailsToggleText}>{sharedVictoryAllowed ? "☑ " : "☐ "}{t("outcomes.sharedAllowed")}</Text>
            </TouchableOpacity>}
            <MatchResultFields players={playerState} onChange={setPlayerState} scoresEnabled={scoresEnabled}
              onScoresEnabled={setScoresEnabled} competitive={!isSolo && !isCooperative && result !== "Undefined"}
              selectionKind={result === "Draw" ? "draw" : "winner"} multiple={result === "Draw" || sharedVictoryAllowed} showErrors={showResultErrors} />
            <Text style={styles.hint}>{t("outcomes.explicitHelp")}</Text>

          </View>
          <View style={styles.card}>
            <MatchRatingField value={personalRating} onChange={setPersonalRating} />
            {showResultErrors && personalRating === undefined && <Text style={styles.hint}>{t("form.ratingRequired")}</Text>}
            <MatchDateFields value={matchDate} locale={locale} picker={datePicker} onPickerChange={setDatePicker}
              onChange={date => { matchDateEdited.current = true; setMatchDate(date); }} />
          </View>
          <TouchableOpacity style={styles.detailsToggle} accessibilityRole="button" accessibilityState={{ expanded: showDetails }}
            onPress={() => setShowDetails(value => !value)}>
            <Text style={styles.detailsToggleText}>{t("details.optionalTitle")}</Text>
            <MaterialIcons name={showDetails ? "expand-less" : "expand-more"} size={22} color={COLORS.primary} />
          </TouchableOpacity>
          {showDetails && <View>
            <View style={styles.card}>
              <DetailField label={t("details.locationLabel")} placeholder={t("details.locationPlaceholder")} value={location} onChangeText={setLocation} />
              <DetailField label={t("details.durationLabel")} placeholder={t("details.durationPlaceholder")} value={duration} onChangeText={setDuration} keyboardType="numeric" />
              <DetailField label={t("details.commentsLabel")} placeholder={t("details.commentsPlaceholder")} value={comments} onChangeText={setComments} multiline numberOfLines={3} />
            </View>

            <View style={styles.card}>
              <SectionTitle icon="auto-stories" label={t("details.journalTitle")} />
              <View style={{ marginTop: 8 }}>
                <DetailField
                  label={t("details.notesLabel")}
                  placeholder={t("details.notesPlaceholder")}
                  value={notes} onChangeText={setNotes} multiline numberOfLines={4}
                />
                <DetailField
                  label={t("details.tagsLabel")}
                  placeholder={t("details.tagsPlaceholder")}
                  value={tags} onChangeText={setTags}
                />
                {tags.trim() !== "" && (
                  <View style={styles.tagsPreviewRow}>
                    {tags.split(",").filter(t => t.trim()).map((tag, i) => (
                      <View key={i} style={styles.tagChip}>
                        <Text style={styles.tagChipText}>#{tag.trim()}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <Text style={[styles.subLabel, { marginTop: 16 }]}>
                {t("photos.label")} {pendingPhotos.length > 0 ? `— ${pendingPhotos.length}/${MAX_PHOTOS}` : ""}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {pendingPhotos.map((uri, pi) => (
                  <View key={pi} style={styles.photoThumbWrap}>
                    <Image source={{ uri }} style={styles.photoThumb} />
                    <TouchableOpacity style={styles.photoRemoveBtn} accessibilityRole="button" accessibilityLabel={t("photos.remove")} onPress={() => handleRemovePendingPhoto(uri)}>
                      <MaterialIcons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                {pendingPhotos.length < MAX_PHOTOS && (
                  <TouchableOpacity style={styles.photoAddBtn} accessibilityRole="button" accessibilityLabel={t("photos.add")} onPress={handlePickPendingPhoto} activeOpacity={0.8}>
                    <MaterialIcons name="add-a-photo" size={20} color={COLORS.primary} />
                    <Text style={styles.photoAddText}>{t("photos.add")}</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
              <Text style={styles.hint}>
                {t("photos.hint")}
              </Text>
            </View>

            </View>}
        </View>
      )}

      {/* ══ STEP 3: Rever ══ */}
      {step === 3 && <View>
          <Text style={styles.hint}>{t("form.reviewHint")}</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{t("summary.title")}</Text>
            <SummaryRow label={t("summary.game")} value={selectedGame?.name ?? "—"} />
            <SummaryRow label={t("summary.mode")} value={`${getModeLabel(gameMode)}${isUnofficial ? " ⚠️" : ""}`} />
            <SummaryRow label={t("summary.result")} value={t(isCooperative ? `outcomes.team${result}` : `outcomes.${result}`)} />
            {result === "Win" && !isSolo && !isCooperative && <SummaryRow label={t("summary.winner")} value={playerState.filter(p => p.isWinner).map(p => p.username).join(", ")} />}
            {sharedVictoryAllowed && !isSolo && !isCooperative && result === "Win" && <Text style={styles.hint}>{t("outcomes.sharedAllowed")}</Text>}
            <ReviewEdit label={t("form.edit", { section: t("steps.game") })} onPress={() => setStep(0)} />
            <SummaryRow label={t("summary.players")} value={`${playerState.length}`} />
            {playerState.map(p => <SummaryRow key={p.id} label={p.username || t("sessions.playerNameUnavailable")}
              value={`${t(`outcomes.${outcomeFor(p.id)}`)} · ${scoresEnabled ? String(p.score?.trim() ?? "") : t("form.withoutScores")}`} />)}
            <ReviewEdit label={t("form.edit", { section: t("steps.players") })} onPress={() => setStep(1)} />
            <SummaryRow label={t("steps.result")} value={t(scoresEnabled ? "form.withScores" : "form.withoutScores")} />
            <ReviewEdit label={t("form.edit", { section: t("steps.result") })} onPress={() => setStep(2)} />
            <SummaryRow label={t("form.date")} value={matchDate.toLocaleDateString(locale)} />
            <SummaryRow label={t("form.time")} value={matchDate.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })} />
            {selectedExpansions.length > 0 && <SummaryRow label={t("summary.expansions")} value={selectedExpansions.map((e) => e.name).join(", ")} />}
            {location.trim() !== "" && <SummaryRow label={t("summary.location")} value={location} />}
            {duration.trim() !== "" && <SummaryRow label={t("summary.duration")} value={t("summary.minutes", { value: duration })} />}
            {personalRating !== undefined && <SummaryRow label={t("summary.rating")} value={`${personalRating}/10`} />}
            {comments.trim() && <SummaryRow label={t("details.commentsLabel")} value={comments.trim()} />}
            {notes.trim() && <SummaryRow label={t("details.notesLabel")} value={notes.trim()} />}
            {tags.trim() && <SummaryRow label={t("details.tagsLabel")} value={tags.trim()} />}
            {isUnofficial && <SummaryRow label={t("modes.reasonLabel")} value={unofficialJustification} />}
            {pendingPhotos.length > 0 && <SummaryRow label={t("photos.label")} value={String(pendingPhotos.length)} />}
            <ReviewEdit label={t("form.edit", { section: t("steps.details") })}
              onPress={() => { setShowDetails(true); setStep(2); }} />
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}
        </View>}

      {disableScroll && footer}
    </View>
  );

  if (disableScroll) return content;

  // ✅ KeyboardAvoidingView garante que as sugestões do GameSelector
  // ficam visíveis mesmo com o teclado aberto
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        ref={scrollRef}
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        {content}
      </ScrollView>
      {footer}
    </KeyboardAvoidingView>
  );
}

/* ── Sub-components ── */

function ProgressBar({ current, total, labels }: { current: number; total: number; labels: readonly string[] }) {
  return (
    <View style={styles.progressContainer}>
      {labels.map((label, i) => {
        const isDone = i < current;
        const isActive = i === current;
        return (
          <React.Fragment key={label}>
            <View style={styles.progressStep}>
              <View style={[styles.progressDot, isDone && styles.progressDotDone, isActive && styles.progressDotActive]}>
                {isDone ? <MaterialIcons name="check" size={14} color="#fff" /> : <Text style={[styles.progressDotText, isActive && styles.progressDotTextActive]}>{i + 1}</Text>}
              </View>
              <Text style={[styles.progressLabel, isActive && styles.progressLabelActive, isDone && styles.progressLabelDone]}>{label}</Text>
            </View>
            {i < total - 1 && <View style={[styles.progressLine, isDone && styles.progressLineDone]} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function SectionTitle({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <MaterialIcons name={icon as any} size={18} color={COLORS.primary} />
      <Text style={styles.sectionTitleText}>{label}</Text>
    </View>
  );
}

function ResultButton({ emoji, label, active, activeColor, onPress }: {
  emoji: string; label: string; active: boolean; activeColor: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.resultBtn, active && { borderColor: activeColor, backgroundColor: activeColor + "18" }]} onPress={onPress} activeOpacity={0.8} accessibilityRole="radio" accessibilityState={{ selected: active }} accessibilityLabel={label}>
      <Text style={styles.resultEmoji}>{emoji}</Text>
      <Text style={[styles.resultLabel, active && { color: activeColor, fontWeight: "700" }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function DetailField({ label, placeholder, value, onChangeText, keyboardType, multiline, numberOfLines }: {
  label: string; placeholder: string; value: string; onChangeText: (v: string) => void;
  keyboardType?: any; multiline?: boolean; numberOfLines?: number;
}) {
  return (
    <View style={styles.detailField}>
      <Text style={styles.detailLabel}>{label}</Text>
      <TextInput
        style={[styles.detailInput, multiline && { minHeight: Math.min(numberOfLines ?? 3, 3) * 22, paddingTop: 10 }]}
        accessibilityLabel={label} placeholder={placeholder} placeholderTextColor={COLORS.textMuted} value={value} onChangeText={onChangeText}
        keyboardType={keyboardType ?? "default"} multiline={multiline} numberOfLines={numberOfLines}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

function ReviewEdit({ label, onPress }: { label: string; onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} style={styles.reviewEdit} onPress={onPress}>
    <Text style={styles.detailsToggleText}>{label}</Text>
    <MaterialIcons name="edit" size={16} color={COLORS.primary} />
  </TouchableOpacity>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 20, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: { marginBottom: 8 },
  title: { ...UI_STYLES.title },
  badgeRow: { flexDirection: "row", marginTop: 6, gap: 8, flexWrap: "wrap" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeQuick: { backgroundColor: COLORS.primary + "18" },
  badgeSession: { backgroundColor: COLORS.secondary + "18" },
  badgeText: { fontSize: 11, fontWeight: "800" },
  badgeQuickText: { color: COLORS.primary },
  badgeSessionText: { color: COLORS.secondary },
  unofficialBadge: { backgroundColor: "#fff8e1", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: "#ffe082" },
  unofficialBadgeText: { fontSize: 11, fontWeight: "700", color: "#f39c12" },

  progressContainer: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  progressStep: { flex: 1, minWidth: 0, alignItems: "center", gap: 4 },
  progressDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  progressDotDone: { backgroundColor: COLORS.success },
  progressDotActive: { backgroundColor: COLORS.primary },
  progressDotText: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },
  progressDotTextActive: { color: "#fff" },
  progressLabel: { ...UI_STYLES.caption, color: COLORS.textMuted, textAlign: "center" },
  progressLabelActive: { color: COLORS.primary, fontWeight: "700" },
  progressLabelDone: { color: COLORS.success },
  progressLine: { width: 8, height: 2, backgroundColor: COLORS.border, marginTop: 15 },
  progressLineDone: { backgroundColor: COLORS.success },

  card: { paddingVertical: 8, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  sectionTitleText: { ...UI_STYLES.section },

  gameRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  modeLink: { minHeight: 44, justifyContent: "center" },
  detailsToggle: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, paddingVertical: 8 },
  detailsToggleText: { ...UI_STYLES.body, color: COLORS.primary, fontWeight: "700", flexShrink: 1 },
  gameName: { ...UI_STYLES.section },
  gameMeta: { ...UI_STYLES.caption, color: COLORS.textMuted, marginTop: 4 },
  subLabel: { fontSize: 13, fontWeight: "700", color: COLORS.onBackground, marginBottom: 8 },


  modeRow: { gap: 8, flexDirection: "row", flexWrap: "wrap" },
  modeBtn: { flexGrow: 1, minWidth: 100, minHeight: 64, alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, gap: 4 },
  modeBtnUnavailable: { backgroundColor: "#f5f5f5", borderColor: "#eee", borderStyle: "dashed" },
  modeBtnLabel: { ...UI_STYLES.body, fontWeight: "700", color: COLORS.textMuted, textAlign: "center" },
  sourceBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 999, marginTop: 2 },
  sourceBadgeOfficial: { backgroundColor: "#E8F5E9" },
  sourceBadgeExpansion: { backgroundColor: "#E3F2FD" },
  sourceBadgeText: { ...UI_STYLES.caption, fontWeight: "700" },
  forceBadge: { backgroundColor: "#f0f0f0", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, marginTop: 2 },
  forceBadgeText: { ...UI_STYLES.caption, color: COLORS.textMuted },
  unofficialSmallBadge: { position: "absolute", top: 4, right: 4 },
  unofficialSmallBadgeText: { fontSize: 10 },
  unofficialWarning: { flexDirection: "row", alignItems: "flex-start", gap: 6, backgroundColor: "#fff8e1", borderRadius: 10, padding: 10, marginTop: 10, borderWidth: 1, borderColor: "#ffe082" },
  unofficialWarningText: { flex: 1, fontSize: 11, color: "#856404", lineHeight: 16 },

  resultRow: { gap: 8 },
  resultBtn: { ...UI_STYLES.control, padding: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, flexDirection: "row", gap: 8 },
  resultEmoji: { fontSize: 22 },
  resultLabel: { ...UI_STYLES.body, color: COLORS.textMuted, flexShrink: 1 },

  soloPlayerRow: { gap: 8, paddingVertical: 12 },
  playerName: { fontSize: 15, fontWeight: "700", color: COLORS.onBackground },

  detailField: { marginBottom: 12 },
  detailLabel: { ...UI_STYLES.body, color: COLORS.onBackground, fontWeight: "700", marginBottom: 4 },
  detailInput: { ...UI_STYLES.field },

  tagsPreviewRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  tagChip: { backgroundColor: COLORS.primary + "14", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  tagChipText: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },

  photoThumb: { width: 96, height: 96, borderRadius: 12, backgroundColor: COLORS.border },
  photoThumbWrap: { position: "relative", marginRight: 12 },
  photoRemoveBtn: { ...UI_STYLES.iconButton, position: "absolute", top: 0, right: 0, backgroundColor: "rgba(0,0,0,0.75)" },
  photoAddBtn: { width: 96, height: 96, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.primarySoft },
  photoAddText: { ...UI_STYLES.caption, color: COLORS.primary, fontWeight: "700", marginTop: 4 },

  summaryCard: { paddingVertical: 12, marginBottom: 12, gap: 8 },
  reviewEdit: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  summaryTitle: { ...UI_STYLES.section, marginBottom: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: "#e0e8f4" },
  summaryLabel: { ...UI_STYLES.caption, color: COLORS.textMuted, flex: 1 },
  summaryValue: { ...UI_STYLES.body, color: COLORS.onBackground, fontWeight: "700", flex: 1.5, textAlign: "right" },

  errorText: { color: COLORS.error, fontWeight: "700", textAlign: "center", marginTop: 10, fontSize: 14 },

  stickyBar: { padding: 16, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border },
  navRowInline: { paddingHorizontal: 0, paddingTop: 12, paddingBottom: 4, borderTopWidth: 1, borderTopColor: "#eee", marginTop: 8 },
  navRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10 },

  noticeWarn: { backgroundColor: "#fff3cd", borderRadius: 14, padding: 16, margin: 16, borderWidth: 1, borderColor: "#ffeeba", alignItems: "center" },
  noticeDanger: { backgroundColor: "#f8d7da", borderRadius: 14, padding: 16, margin: 16, borderWidth: 1, borderColor: "#f5c6cb", alignItems: "center" },
  noticeTitle: { fontWeight: "800", color: "#333", fontSize: 16, marginBottom: 8, textAlign: "center" },
  noticeText: { color: COLORS.textMuted, fontWeight: "600", textAlign: "center", marginTop: 4 },

  modalTitle: { fontSize: 18, fontWeight: "800", color: "#333", marginBottom: 10 },
  modalDesc: { fontSize: 14, color: COLORS.textMuted, lineHeight: 20, marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: "700", color: "#333", marginBottom: 6 },
  modalInput: { ...UI_STYLES.field, minHeight: 100, textAlignVertical: "top" },
  modalHint: { fontSize: 11, color: COLORS.textMuted, textAlign: "right", marginTop: 4, marginBottom: 16 },
  modalActions: { flexDirection: "row", gap: 10 },
  modalCancelBtn: { ...UI_STYLES.button, flex: 1, backgroundColor: COLORS.primarySoft },
  modalCancelText: { color: COLORS.textMuted, fontWeight: "600" },
  modalConfirmBtn: { ...UI_STYLES.button, flex: 1, backgroundColor: COLORS.primary },
  modalConfirmText: { color: "#fff", fontWeight: "700" },

  hint: { ...UI_STYLES.caption, color: COLORS.textMuted, marginTop: 12 },
});
