/**
 * Register a match in five short steps: Jogo → Jogadores → Resultado → Avaliação e data → Rever.
 * - Jogo: library grid and a search over library and catalogue; any catalogue game can be chosen. Then a summary
 *   with «Mudar», the mode and the expansions used. A game chosen before opening with a single catalogue mode and
 *   none of your expansions to indicate opens directly at Jogadores.
 * - Changing mode or answer keeps what stays valid and clears, at that moment, the selections that no longer apply,
 *   with a notice and «Desfazer»; nothing incompatible stays hidden to be saved.
 * - Rating is required (0–10 in half points, zero ≠ not rated); duration needs an answer: a value (estimate by
 *   default) or «Não sei». Scores never decide the winner. Rules, calculations and permissions are unchanged.
 */
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
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";

import { Glyph } from "@/src/ui/components";
import { colors, radius, space, strong, touch, type } from "@/src/ui/theme";
import { useRegisterMatch } from "../hooks/useRegisterMatch";
import matchService from "../services/matchService";
import sessionService from "../../sessions/services/sessionService";
import gameService from "../../catalog/services/gameService";
import { useGameSearch } from "../../catalog/hooks/useGameSearch";
import { useUserLibrary } from "@/src/features/library/hooks/useUserLibrary";
import { GameLibraryStatus } from "@/src/features/library/types/GameLibraryStatus";
import { toMatchPlayerDto } from "../../../users/utils/playerMappers";
import { ExpansionSelector } from "../../catalog/components/ExpansionSelector";
import PlayerSelector from "../../../users/components/PlayerSelector";
import { Game } from "../../catalog/types/Game";
import { useRouter } from "expo-router";
import MatchSummary from "./MatchSummary";
import MatchResultFields from "./MatchResultFields";
import ResultChoices from "./ResultChoices";
import GamePicker, { PickedGame } from "./GamePicker";
import GameSummaryCard from "./GameSummaryCard";
import RatingControl from "./RatingControl";
import DurationField from "./DurationField";
import { hasCompleteScores } from "../utils/registrationScores";
import MatchDateFields from "./MatchDateFields";
import { initialSessionMatchDate } from "../utils/registrationDate";
import { checkDuration, durationComplete, durationPayload, DurationDraft, emptyDuration, formatDuration } from "../utils/matchDuration";
import { MatchDto, MatchFormData, MatchOutcome } from "../types/MatchForm";
import { PlayerState } from "../../../users/types/PlayerState";
import { useFriends } from "../../../friends/hooks/useFriends";
import { GameSession } from "../../sessions/types/GameSession";
import { sessionPlayerGuards } from "../../sessions/types/GameSessionPlayer";
import { User } from "../../../users/types/User";
import {
  getAvailableModes, getDefaultMode,
  GameMode, AvailableModes, GameSuggestion,
} from "../../catalog/types/GameSuggestion";

type SoloResult = "player_win" | "game_win" | "draw" | "none";

type Props = {
  sessionId?: string;
  currentUser?: { id: string; userName: string };
  disableScroll?: boolean;
  onRegistered?: () => void;
  /** Game chosen before opening the form (e.g. from a game page); the user can still change it. */
  initialGame?: Game | null;
};

type Step = 0 | 1 | 2 | 3 | 4;
const LAST: Step = 4;
const MODES: GameMode[] = ["solo", "multiplayer", "cooperative"];

/** What a mode or answer change cleared, so «Desfazer» can put it back. */
type Snapshot = { gameMode: GameMode; unofficialMode: GameMode | null; soloResult: SoloResult; teamResult: "win" | "loss" | "draw" | null;
  competitiveResult: "Win" | "Draw" | "Undefined"; sharedVictoryAllowed: boolean; winners: string[] };
type Notice = { kind: "mode" | "result"; mode?: GameMode; snapshot: Snapshot } | null;

export default function RegisterMatchForm({ sessionId, currentUser, disableScroll = false, onRegistered, initialGame }: Props) {
  const { t, i18n } = useTranslation("matches");
  const scrollRef = useRef<ScrollView>(null);
  const isSessionMatch = !!sessionId;

  const steps = useMemo(() => [t("steps.game"), t("steps.players"), t("steps.result"), t("steps.ratingDate"), t("steps.review")], [t]);
  const locale = i18n.resolvedLanguage === "pt" ? "pt-PT" : "en-GB";
  const getModeLabel = (mode: GameMode): string => t(mode === "solo" ? "modes.solo" : mode === "cooperative" ? "modes.cooperative" : "modes.competitive");

  const { submitMatch, loading, error } = useRegisterMatch();
  const { friends, loading: friendsLoading } = useFriends();
  const { searchGame } = useGameSearch();
  const { library } = useUserLibrary();

  const [session, setSession] = useState<GameSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [step, setStep] = useState<Step>(0);
  useEffect(() => {
    Keyboard.dismiss();
    setDatePicker(null);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);

  const [selectedGame, setSelectedGame] = useState<Game | null>(initialGame ?? null);
  const [editingGame, setEditingGame] = useState(!initialGame);
  const [selectedExpansions, setSelectedExpansions] = useState<Game[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>("multiplayer");
  const [soloResult, setSoloResult] = useState<SoloResult>("none");
  const [playerState, setPlayerState] = useState<PlayerState[]>([]);
  const multiplayerDraft = useRef<PlayerState[]>([]);
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState<DurationDraft>(emptyDuration);
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
  const durationTouched = !!(duration.hours || duration.minutes || duration.method);
  const navigationGuard = useUnsavedChanges(!savedMatch && ((!!selectedGame && selectedGame.id !== initialGame?.id) || !!location || durationTouched || !!comments || personalRating !== undefined || !!notes || !!tags || pendingPhotos.length > 0), loading || uploadingPhotos, sessionId ? `/games/sessions/${sessionId}` : undefined);

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
  // New state goes after the existing state, in this order.
  const [picked, setPicked] = useState<PickedGame | null>(null);
  const [resolvingGame, setResolvingGame] = useState(false);
  const [pickError, setPickError] = useState(false);
  const [showRatingErrors, setShowRatingErrors] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [editingWhen, setEditingWhen] = useState(false);
  const [ownedExpansions, setOwnedExpansions] = useState<GameSuggestion[] | null>(null);
  const [showExpansions, setShowExpansions] = useState(false);
  const initializedSessionDate = useRef<string | null>(null);
  const matchDateEdited = useRef(false);
  const autoStarted = useRef(false);
  const restoreWinners = useRef<string[] | null>(null);

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
  const acceptedUsersFromSession: User[] = useMemo(() => (session?.players ?? [])
    .filter(sessionPlayerGuards.isAccepted).map((p) => ({ id: p.userId, userName: p.userName } as User)), [session]);
  const availableUsers: User[] = useMemo(() => isSessionMatch ? acceptedUsersFromSession : friends ?? [], [isSessionMatch, acceptedUsersFromSession, friends]);
  const currentUserForSelector = useMemo(() => {
    if (!currentUser?.id) return undefined;
    if (!isSessionMatch) return currentUser;
    return acceptedUsersFromSession.some((u) => u.id === currentUser.id) ? currentUser : undefined;
  }, [currentUser, isSessionMatch, acceptedUsersFromSession]);

  const ownedLibrary = useMemo(() => (library ?? []).filter(e => e.status === GameLibraryStatus.Owned), [library]);
  const ownedBggKey = ownedLibrary.map(e => e.bggId).sort().join(",");
  const selectedOwned = !!selectedGame && ownedLibrary.some(e => e.gameId === selectedGame.id);

  const availableModes = useMemo((): AvailableModes => {
    if (!selectedGame) return {
      solo:        { available: true,  source: null, label: t("modes.solo"),        icon: "account"   },
      multiplayer: { available: true,  source: null, label: t("modes.competitive"), icon: "account-multiple"   },
      cooperative: { available: false, source: null, label: t("modes.cooperative"), icon: "heart" },
    };
    return getAvailableModes(selectedGame, selectedExpansions[0] ?? null);
  }, [selectedGame, selectedExpansions, t]);

  useEffect(() => {
    if (!selectedGame) return;
    const best = getDefaultMode(selectedGame, selectedExpansions[0] ?? null);
    setGameMode(isSessionMatch && best === "solo" ? "multiplayer" : best);
    setUnofficialMode(null);
    setUnofficialJustification("");
    setSoloResult("none");
    setTeamResult(null);
  }, [selectedGame?.id, selectedExpansions]);

  // Expansions of this game that you own: when there are some, the configuration asks about them first.
  useEffect(() => {
    let on = true;
    setOwnedExpansions(null);
    if (!selectedGame?.id || selectedGame.isExpansion) { setOwnedExpansions([]); return; }
    const owned = new Set(ownedLibrary.map(e => e.bggId));
    Promise.resolve(gameService.getExpansionsOfBase(selectedGame.id))
      .then((list: GameSuggestion[] | undefined) => { if (on) setOwnedExpansions((list ?? []).filter(e => owned.has(e.bggId))); })
      .catch(() => { if (on) setOwnedExpansions([]); });
    return () => { on = false; };
  }, [selectedGame?.id, ownedBggKey]);

  const isSolo = gameMode === "solo";
  const isCooperative = gameMode === "cooperative";
  const result: MatchOutcome = isSolo ? soloResult === "player_win" ? "Win" : soloResult === "game_win" ? "Loss" : soloResult === "draw" ? "Draw" : "Undefined"
    : isCooperative ? teamResult === "win" ? "Win" : teamResult === "loss" ? "Loss" : teamResult === "draw" ? "Draw" : "Undefined" : competitiveResult;
  const resultPlayerIds = !isSolo && !isCooperative && result !== "Undefined" ? playerState.filter(p => p.isWinner).map(p => p.id) : [];
  const outcomeFor = (id: string): MatchOutcome => isSolo || isCooperative || result === "Undefined" ? result : resultPlayerIds.includes(id) ? result : "Loss";
  const isUnofficial = unofficialMode === gameMode;
  const officialModes = MODES.filter(m => availableModes[m].available && !(isSessionMatch && m === "solo"));

  // A game chosen before opening, with a single catalogue mode and none of your expansions to indicate: start at Jogadores.
  useEffect(() => {
    if (autoStarted.current || !initialGame || selectedGame?.id !== initialGame.id || editingGame || ownedExpansions === null || step !== 0) return;
    autoStarted.current = true;
    if (officialModes.length <= 1 && ownedExpansions.length === 0) setStep(1);
  }, [initialGame?.id, selectedGame?.id, editingGame, ownedExpansions, step, officialModes.length]);

  useEffect(() => {
    if (isSolo && currentUser?.id) {
      setPlayerState(prev => {
        if (prev.length > 1) multiplayerDraft.current = prev;
        return [{ id: currentUser.id, username: currentUser.userName, score: prev.find(p => p.id === currentUser.id)?.score ?? "", isWinner: false }];
      });
    } else if (multiplayerDraft.current.length) {
      const draft = multiplayerDraft.current;
      const winners = restoreWinners.current;
      multiplayerDraft.current = []; restoreWinners.current = null;
      setPlayerState(prev => draft.map(p => ({ ...p, isWinner: !!winners?.includes(p.id),
        score: p.id === currentUser?.id ? prev.find(player => player.id === p.id)?.score ?? p.score : p.score })));
    }
  }, [isSolo, currentUser?.id, currentUser?.userName]);
  // A game chosen before opening (e.g. from a game page) arrives asynchronously.
  useEffect(() => {
    if (initialGame && !selectedGame) { setSelectedGame(initialGame); setEditingGame(false); }
  }, [initialGame?.id]);

  /* ── Mode and answer changes: keep what stays valid, clear the rest now, offer «Desfazer» ── */
  const snapshot = (): Snapshot => ({ gameMode, unofficialMode, soloResult, teamResult, competitiveResult, sharedVictoryAllowed, winners: playerState.filter(p => p.isWinner).map(p => p.id) });
  const hasResultChoices = playerState.some(p => p.isWinner) || teamResult !== null || soloResult !== "none" || sharedVictoryAllowed;
  const switchMode = (mode: GameMode, unofficial: boolean) => {
    if (mode !== gameMode) {
      setNotice(hasResultChoices ? { kind: "mode", mode, snapshot: snapshot() } : null);
      setPlayerState(prev => prev.map(p => ({ ...p, isWinner: false })));
      setTeamResult(null); setSoloResult("none"); setSharedVictoryAllowed(false);
    }
    setGameMode(mode);
    setUnofficialMode(unofficial ? mode : null);
    if (!unofficial) setUnofficialJustification("");
  };
  const changeCompetitiveResult = (value: "Win" | "Draw" | "Undefined") => {
    if (value === competitiveResult) return;
    const winners = playerState.filter(p => p.isWinner).length;
    setNotice(winners || sharedVictoryAllowed ? { kind: "result", snapshot: snapshot() } : null);
    setCompetitiveResult(value); setSharedVictoryAllowed(false);
    setPlayerState(prev => prev.map(p => ({ ...p, isWinner: false })));
  };
  const undo = () => {
    if (!notice) return;
    const s = notice.snapshot;
    if (s.gameMode !== "solo" && isSolo) restoreWinners.current = s.winners;
    else setPlayerState(prev => prev.map(p => ({ ...p, isWinner: s.winners.includes(p.id) })));
    setGameMode(s.gameMode); setUnofficialMode(s.unofficialMode); setSoloResult(s.soloResult); setTeamResult(s.teamResult);
    setCompetitiveResult(s.competitiveResult); setSharedVictoryAllowed(s.sharedVictoryAllowed);
    setNotice(null);
  };

  const handleModePress = (mode: GameMode) => {
    if (isSessionMatch && mode === "solo") return;
    if (availableModes[mode].available) switchMode(mode, false);
    else { setPendingUnofficialMode(mode); setUnofficialJustification(""); setShowUnofficialModal(true); }
  };
  const handleConfirmUnofficial = () => {
    if (!pendingUnofficialMode || (isSessionMatch && pendingUnofficialMode === "solo") || unofficialJustification.trim().length < 5) return;
    switchMode(pendingUnofficialMode, true);
    setShowUnofficialModal(false);
    setPendingUnofficialMode(null);
  };
  const handleCancelUnofficial = () => { setShowUnofficialModal(false); setPendingUnofficialMode(null); setUnofficialJustification(""); };

  /* ── Game choice ── */
  const chooseGame = (game: Game) => {
    if (game.id !== selectedGame?.id) { setSelectedGame(game); setSelectedExpansions([]); }
    setEditingGame(false); setPickError(false); setShowExpansions(false);
  };
  const confirmPick = async () => {
    if (!picked || resolvingGame) return;
    if (picked.owned && picked.game.id) return chooseGame(picked.game);
    setResolvingGame(true);
    try {
      const game = await searchGame(picked.game.name);
      if (!game) { setPickError(true); return; }
      chooseGame({ ...game, isExpansion: game.isExpansion ?? picked.game.isExpansion, yearPublished: game.yearPublished ?? picked.game.yearPublished, imageUrl: game.imageUrl ?? picked.game.imageUrl });
    } finally { setResolvingGame(false); }
  };
  const changeGame = () => { setStep(0); setEditingGame(true); setPicked(null); };

  /* ── Validation by step ── */
  const participantsValid = !(isSessionMatch && isSolo) && (isSolo ? new Set(playerState.map(p => p.id).filter(Boolean)).size === 1 : new Set(playerState.map(p => p.id).filter(Boolean)).size >= 2);
  const validateParticipants = () => {
    if (participantsValid) return true;
    Alert.alert(t("validation.errorTitle"), t(isSessionMatch && isSolo ? "form.sessionNoSolo" : "form.twoPlayers"));
    return false;
  };
  const sharedNeedsConfirm = !isSolo && !isCooperative && result === "Win" && resultPlayerIds.length > 1 && !sharedVictoryAllowed;
  const validateResult = (): boolean => {
    setShowResultErrors(true);
    if (!validateParticipants()) return false;
    if (!hasCompleteScores(playerState, scoresEnabled)) return false;
    if (!isSolo && !isCooperative && result !== "Undefined" && resultPlayerIds.length < (result === "Draw" ? 2 : 1)) {
      Alert.alert(t("validation.errorTitle"), t(result === "Draw" ? "outcomes.twoDrawPlayers" : "validation.selectWinner")); return false;
    }
    if (sharedNeedsConfirm) { Alert.alert(t("validation.errorTitle"), t("result.sharedRequired")); return false; }
    return true;
  };
  const validateRatingDate = (): boolean => {
    setShowRatingErrors(true);
    if (personalRating === undefined || !Number.isFinite(personalRating) || personalRating < 0 || personalRating > 10 || !Number.isInteger(personalRating * 2)) {
      Alert.alert(t("validation.errorTitle"), t("rating.error")); return false;
    }
    if (!durationComplete(duration)) {
      const c = checkDuration(duration);
      Alert.alert(t("validation.errorTitle"), t(c.state === "value" ? (c.unusual === "long" ? "duration.long" : "duration.short") : c.state === "invalid" ? (c.reason === "minutes" ? "duration.minutesRange" : c.reason === "zero" ? "duration.zero" : "duration.format") : "duration.error",
        c.state === "value" ? { value: formatDuration(c.minutes) } : undefined)); return false;
    }
    if (!Number.isFinite(matchDate.getTime()) || matchDate.getTime() > Date.now() + 60000) {
      Alert.alert(t("validation.errorTitle"), t("form.dateInvalid")); return false;
    }
    return true;
  };
  const canGoNext = (): boolean => {
    if (step === 0) return editingGame ? !!picked && !resolvingGame : !!selectedGame;
    if (step === 1 || step === 2) return playerState.length > 0;
    return true;
  };
  const goNext = () => {
    if (step === 0 && editingGame) return confirmPick();
    if (step === 1 && !validateParticipants()) return;
    if (step === 2 && !validateResult()) return;
    if (step === 3 && !validateRatingDate()) return;
    if (step === 2) setNotice(null);
    if (step < LAST && canGoNext()) setStep((s) => (s + 1) as Step);
  };
  const goPrev = () => { if (step > 0) setStep((s) => (s - 1) as Step); };

  const handlePickPendingPhoto = async () => {
    if (pendingPhotos.length >= MAX_PHOTOS) { Alert.alert(t("validation.errorTitle"), t("photos.limit", { count: MAX_PHOTOS })); return; }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert(t("photos.permissionTitle"), t("photos.permission")); return; }
    const picture = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: false });
    if (picture.canceled || !picture.assets?.[0]?.uri) return;
    setPendingPhotos((prev) => [...prev, picture.assets[0].uri]);
  };
  const handleRemovePendingPhoto = (uri: string) => setPendingPhotos((prev) => prev.filter((p) => p !== uri));

  const clearAll = () => {
    submittedMatch.current = null;
    multiplayerDraft.current = [];
    matchDateEdited.current = false;
    initializedSessionDate.current = null;
    navigationGuard.markUnsaved();
    setSelectedGame(null); setSelectedExpansions([]); setPlayerState([]);
    setLocation(""); setDuration(emptyDuration); setComments("");
    setPersonalRating(undefined); setNotes(""); setTags(""); setPendingPhotos([]);
    setUnofficialMode(null); setUnofficialJustification("");
    setSavedMatch(null); setFailedPhotos([]); setScoresEnabled(false);
    setMatchDate(isSessionMatch && session ? initialSessionMatchDate(session, new Date()) : new Date());
    setCompetitiveResult("Win"); setSharedVictoryAllowed(false);
    setShowDetails(false); setShowResultErrors(false); setShowRatingErrors(false); setDatePicker(null); setTeamResult(null);
    setPicked(null); setNotice(null); setEditingWhen(false); setShowExpansions(false);
    setEditingGame(true); setGameMode("multiplayer"); setSoloResult("none"); setStep(0);
  };

  const handleSubmit = async () => {
    if (submittedMatch.current || submitting.current) return;
    if (!selectedGame) return Alert.alert(t("validation.errorTitle"), t("validation.selectGame"));
    if (playerState.length === 0) return Alert.alert(t("validation.errorTitle"), t("validation.addPlayer"));
    if (currentUserForSelector && !playerState.some(p => p.id === currentUserForSelector.id))
      return Alert.alert(t("validation.errorTitle"), t("selector.participationRequired"));
    if (!validateParticipants()) { setStep(1); return; }
    if (!validateResult()) { setStep(2); return; }
    if (!validateRatingDate()) { setStep(3); return; }

    const winnerId = result === "Win" && !isCooperative ? isSolo ? currentUser?.id : resultPlayerIds.length === 1 ? resultPlayerIds[0] : undefined : undefined;
    let players: MatchFormData["players"];
    try {
      players = toMatchPlayerDto(scoresEnabled ? playerState : playerState.map(p => ({ ...p, score: "" })));
    } catch (failure) {
      return Alert.alert(t("validation.errorTitle"), (failure as Error).message);
    }
    const payload: MatchFormData = {
      gameId: selectedGame.id,
      gameName: selectedGame.name,
      matchDate: matchDate.toISOString(),
      scoresEnabled,
      location: location.trim() || undefined,
      ...durationPayload(duration),
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

  if (savedMatch) return <View style={{ flex: 1, backgroundColor: colors.background }}>
    <ScreenHeader title={t("success.savedTitle")} appearance="refresh" subtitle={session?.name}
      onLeftPress={isSessionMatch ? returnToSession : navigationGuard.cancel} />
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={{ gap: 16 }}>
        <MatchSummary match={savedMatch} />
        {uploadingPhotos && <Text style={type.caption}>{t("photos.uploading")}</Text>}
        {!uploadingPhotos && failedPhotos.length > 0 && <View style={{ gap: 8 }}>
          <Text style={type.caption}>{t("success.photosFailed", { count: failedPhotos.length })}</Text>
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
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (isSessionMatch && !sessionLoading && !session)
    return <View style={styles.noticeDanger}>
      <Text style={styles.noticeTitle}>{t("session.notFoundTitle")}</Text>
      <Text style={styles.noticeText}>{t("session.notFoundDescription")}</Text>
    </View>;
  if (isSessionMatch && session && !sessionIsActive) {
    const when = session.scheduledStartDate ? new Date(session.scheduledStartDate).toLocaleString(locale) : "—";
    return <View style={styles.noticeWarn}>
      <Text style={styles.noticeTitle}>{session.status === "Upcoming" ? t("session.upcomingTitle") : t("session.closedTitle")}</Text>
      <Text style={styles.noticeText}>🗓 {when}</Text>
      <Text style={styles.noticeText}>{t("session.inactiveDescription")}</Text>
    </View>;
  }
  if (isSessionMatch && session && (acceptedUsersFromSession.length === 0 || !currentUserForSelector))
    return <View style={styles.noticeWarn}>
      <Text style={styles.noticeTitle}>{t(currentUserForSelector ? "session.noAcceptedTitle" : "session.notEligibleTitle")}</Text>
      <Text style={styles.noticeText}>{t(currentUserForSelector ? "session.noAcceptedDescription" : "session.notEligibleDescription")}</Text>
    </View>;

  const summary = selectedGame && <GameSummaryCard game={selectedGame} modeLabel={getModeLabel(gameMode) + (isUnofficial ? ` · ${t("header.unofficialBadge")}` : "")} onChange={changeGame} />;
  const noticeBar = notice && <View style={styles.notice} accessibilityLiveRegion="polite">
    <Glyph name="information-outline" size={20} color={colors.friend} />
    <Text style={[type.caption, styles.flex, { color: colors.text }]}>{notice.kind === "mode" ? t("modeNotice.mode", { mode: getModeLabel(notice.mode!) }) : t("modeNotice.result")}</Text>
    <TouchableOpacity accessibilityRole="button" onPress={undo} style={styles.link}><Text style={styles.linkText}>{t("modeNotice.undo")}</Text></TouchableOpacity>
  </View>;
  const sameDay = matchDate.toDateString() === new Date().toDateString();
  // «Hoje · qua., 15 out. 2026 · 21:30»: composed from parts so every engine shows the short month name.
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "short" }).format(matchDate);
  const month = new Intl.DateTimeFormat(locale, { month: "short" }).format(matchDate);
  const whenText = [sameDay ? t("when.today") : null, `${weekday} ${matchDate.getDate()} ${month} ${matchDate.getFullYear()}`.replace(/^(\S+?),?\s/, "$1, "),
    matchDate.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })].filter(Boolean).join(" · ");
  const durationCheck = checkDuration(duration);
  const durationReview = durationCheck.state === "unknown" ? t("duration.reviewUnknown") : durationCheck.state === "value"
    ? t("duration.review", { value: formatDuration(durationCheck.minutes), method: t(durationCheck.method === "Measured" ? "duration.reviewMeasured" : "duration.reviewEstimated") }) : "—";
  const resultText = isSolo ? t(result === "Win" ? "result.iWon" : result === "Loss" ? "result.iLost" : result === "Draw" ? "result.draw" : "result.undefined")
    : isCooperative ? t(result === "Win" ? "result.weWon" : result === "Loss" ? "result.weLost" : result === "Draw" ? "result.draw" : "result.undefined")
    : result === "Undefined" ? t("result.undefined") : result === "Draw" ? t("outcomes.tiedNamed", { name: playerState.filter(p => p.isWinner).map(p => p.username).join(", ") })
    : resultPlayerIds.length > 1 ? t("outcomes.winnersNamed", { name: playerState.filter(p => p.isWinner).map(p => p.username).join(", ") })
    : `${t("summary.winner")}: ${playerState.find(p => p.isWinner)?.username ?? "—"}`;

  const footer = <View style={disableScroll ? styles.footerInline : styles.footer}>
    {step === 0 && editingGame && picked && <View style={styles.pickbar} accessibilityLiveRegion="polite">
      <Glyph name="check-circle" size={20} color={colors.primary} />
      <Text style={[type.caption, styles.flex, { color: colors.text }]}><Text style={strong}>{t("picker.chosen")}:</Text> {picked.game.name}{picked.owned ? "" : <Text style={{ color: colors.muted }}>{` · ${t("picker.notOwned")}`}</Text>}</Text>
    </View>}
    {step === 0 && pickError && <Text style={[type.caption, { color: colors.danger }]}>{t("picker.notFound")}</Text>}
    <View style={styles.navRow}>
      {step > 0 && <View style={{ flex: 1, minWidth: 100 }}><PrimaryButton title={t("navigation.back")} variant="secondary" onPress={goPrev} /></View>}
      <View style={{ flex: 2, minWidth: 140 }}>
        {step < LAST
          ? <PrimaryButton title={t(step === 3 ? "navigation.review" : "navigation.continue")} onPress={goNext} disabled={!canGoNext()} loading={resolvingGame} />
          : <PrimaryButton title={uploadingPhotos ? t("photos.uploading") : t("navigation.save")} onPress={handleSubmit} loading={loading || uploadingPhotos} />}
      </View>
    </View>
  </View>;

  const content = <View style={styles.page}>
    {!disableScroll && <ScreenHeader mode="cancel" title={t("header.registerMatch")} subtitle={session?.name ?? t("header.quickSubtitle")} onLeftPress={navigationGuard.cancel} />}
    {disableScroll && <View style={styles.inlineHeader}>
      <PrimaryButton title={i18n.t("navigation:cancel")} variant="secondary" onPress={() => navigationGuard.discard(clearAll)} />
      <Text style={type.title}>{isSessionMatch ? t("header.addMatch") : t("header.registerMatch")}</Text>
    </View>}
    <ProgressBar current={step} labels={steps} />

    {/* ══ 1 · Jogo ══ */}
    {step === 0 && (editingGame ? <GamePicker value={picked} onPick={p => { setPicked(p); setPickError(false); }} /> : selectedGame && <View style={styles.stack}>
      {summary}
      {!selectedOwned && <View style={styles.note}><Glyph name="information-outline" size={16} color={colors.friend} /><Text style={[type.caption, styles.flex]}>{t("picker.notOwnedNote")}</Text></View>}
      <View style={styles.card}>
        <Text style={styles.label}>{t("modes.sectionTitle")}</Text>
        {isSessionMatch && <Text style={type.caption}>{t("form.sessionNoSolo")}</Text>}
        <View style={styles.segment}>
          {MODES.map(mode => {
            const info = availableModes[mode];
            const blocked = isSessionMatch && mode === "solo";
            const on = gameMode === mode;
            return <TouchableOpacity key={mode} disabled={blocked} onPress={() => handleModePress(mode)} accessibilityRole="radio"
              accessibilityLabel={getModeLabel(mode) + (!info.available && !blocked ? `, ${t("modes.force")}` : "")} accessibilityState={{ selected: on, disabled: blocked }}
              style={[styles.segmentItem, on && styles.segmentOn, (blocked || !info.available) && styles.segmentDim]}>
              <Text style={[type.body, on && strong, (blocked || !info.available) && { color: colors.muted }]}>{getModeLabel(mode)}</Text>
              {!blocked && !info.available && <Text style={type.micro}>{t("modes.force")}</Text>}
            </TouchableOpacity>;
          })}
        </View>
        {officialModes.length > 1 && !isUnofficial && <Text style={type.caption}>{t("modes.chooseMode")}</Text>}
        {availableModes[gameMode].available && availableModes[gameMode].source && <View style={styles.inline}>
          <Glyph name="check-circle" size={14} color={colors.primary} />
          <Text style={type.caption}>{[availableModes[gameMode].source === "expansion" ? t("modes.expansionShort") : t("modes.inCatalog"),
            selectedGame.minPlayers || selectedGame.maxPlayers ? t("modes.playersRange", { min: selectedGame.minPlayers ?? 1, max: selectedGame.maxPlayers ?? selectedGame.minPlayers }) : null].filter(Boolean).join(" · ")}</Text>
        </View>}
        {isUnofficial && <View style={styles.warning}><Glyph name="alert" size={14} color={colors.pendingIcon} /><Text style={[type.caption, styles.flex, { color: colors.pendingText }]}>{t("modes.unofficialWarning", { justification: unofficialJustification })}</Text></View>}
      </View>
      {noticeBar}
      {!selectedGame.isExpansion && <View style={styles.card}>
        <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: showExpansions }} onPress={() => setShowExpansions(v => !v)} style={styles.rowButton}>
          <Glyph name="layers-outline" size={20} color={colors.friend} />
          <View style={styles.flex}>
            <Text style={[type.body, strong]}>{t("picker.expansionsUsed")}</Text>
            <Text style={type.caption}>{selectedExpansions.length ? selectedExpansions.map(e => e.name).join(", ")
              : ownedExpansions?.length ? t("picker.ownedExpansionsQuestion", { count: ownedExpansions.length, names: ownedExpansions.map(e => e.name).join(", ") }) : t("picker.noExpansions")}</Text>
          </View>
          <Glyph name={showExpansions ? "chevron-up" : "chevron-down"} size={22} color={colors.chevron} />
        </TouchableOpacity>
        {showExpansions && <ExpansionSelector appearance="refresh" baseGameId={selectedGame.id} selectedExpansions={selectedExpansions} onChange={setSelectedExpansions} />}
      </View>}
      <Modal visible={showUnofficialModal} transparent animationType="fade">
        <DialogSurface>
          <Text style={styles.modalTitle}>{t("modes.modalTitle")}</Text>
          <Text style={styles.modalDesc}>
            {t("modes.modalBeforeMode")}
            <Text style={{ fontWeight: "800" }}>{pendingUnofficialMode ? getModeLabel(pendingUnofficialMode) : ""}</Text>{t("modes.modalAfterMode")}
            <Text style={{ fontWeight: "800", color: colors.danger }}>{t("modes.modalRankingWarning")}</Text>
          </Text>
          <Text style={styles.modalLabel}>{t("modes.reasonLabel")}</Text>
          <TextInput style={styles.modalInput} value={unofficialJustification} onChangeText={setUnofficialJustification} accessibilityLabel={t("modes.reasonLabel")}
            placeholder={t("modes.reasonPlaceholder")} placeholderTextColor={colors.placeholder} multiline numberOfLines={3} textAlignVertical="top" maxLength={200} />
          <Text style={styles.modalHint}>{unofficialJustification.length}/200</Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={handleCancelUnofficial}><Text style={styles.modalCancelText}>{t("modes.cancel")}</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.modalConfirmBtn, unofficialJustification.trim().length < 5 && { opacity: 0.4 }]} onPress={handleConfirmUnofficial}
              disabled={unofficialJustification.trim().length < 5}><Text style={styles.modalConfirmText}>{t("modes.useAnyway")}</Text></TouchableOpacity>
          </View>
        </DialogSurface>
      </Modal>
    </View>)}

    {/* ══ 2 · Jogadores ══ */}
    {step === 1 && <View style={styles.stack}>
      {summary}
      {!participantsValid && <View style={styles.note}>
        <Glyph name="information-outline" size={16} color={colors.friend} />
        <View style={styles.flex}>
          <Text style={type.caption}>{t(isSessionMatch && isSolo ? "form.sessionNoSolo" : "form.twoPlayers")}</Text>
          <Text style={type.caption}>{t(isSessionMatch ? "form.sessionPlayersHint" : "form.quickPlayersHint")}</Text>
          {!isSessionMatch && <TouchableOpacity accessibilityRole="button" onPress={() => setStep(0)} style={styles.link}>
            <Text style={styles.linkText}>{t("form.changeMode")}</Text>
          </TouchableOpacity>}
        </View>
      </View>}
      {isSolo ? <View style={styles.card}>
        <Text style={[type.body, strong]}>{currentUser?.userName ?? t("players.you")}</Text>
        <Text style={type.caption}>{t("selector.participationRequired")}</Text>
      </View> : !isSessionMatch && friendsLoading ? <ActivityIndicator color={colors.primary} /> :
        <PlayerSelector title={t("steps.players")} users={availableUsers} players={playerState} onChange={setPlayerState}
          currentUser={currentUserForSelector} lockCurrentUser selectionOnly mode={isSessionMatch ? "session" : "quick"} maxResults={12} />}
    </View>}

    {/* ══ 3 · Resultado ══ */}
    {step === 2 && <View style={styles.stack}>
      {summary}
      {noticeBar}
      <ResultChoices kind={isSolo ? "solo" : isCooperative ? "cooperative" : "competitive"} value={result} onChange={value => {
        if (isSolo) setSoloResult(value === "Win" ? "player_win" : value === "Loss" ? "game_win" : value === "Draw" ? "draw" : "none");
        else if (isCooperative) setTeamResult(value === "Win" ? "win" : value === "Loss" ? "loss" : value === "Draw" ? "draw" : null);
        else changeCompetitiveResult(value as "Win" | "Draw" | "Undefined");
      }} />
      <MatchResultFields players={playerState} onChange={setPlayerState} scoresEnabled={scoresEnabled} onScoresEnabled={setScoresEnabled}
        selection={!isSolo && !isCooperative && result !== "Undefined" ? (result === "Draw" ? "tied" : "winner") : null} outcomeFor={outcomeFor} showErrors={showResultErrors} />
      {!isSolo && !isCooperative && result !== "Undefined" && showResultErrors && resultPlayerIds.length < (result === "Draw" ? 2 : 1) &&
        <Text accessibilityLiveRegion="polite" style={[type.caption, { color: colors.danger }]}>{t(result === "Draw" ? "outcomes.twoDrawPlayers" : "validation.selectWinner")}</Text>}
      {!isSolo && !isCooperative && result === "Win" && resultPlayerIds.length > 1 && <View style={styles.shared}>
        <Text style={[type.caption, { color: colors.pendingText }]}>{t("result.shared")}</Text>
        <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: sharedVictoryAllowed }} onPress={() => setSharedVictoryAllowed(v => !v)} style={styles.rowButton}>
          <Glyph name={sharedVictoryAllowed ? "checkbox-marked" : "checkbox-blank-outline"} size={24} color={colors.primary} />
          <Text style={[type.body, strong, styles.flex]}>{t("result.sharedConfirm")}</Text>
        </TouchableOpacity>
      </View>}
      <View style={styles.note}><Glyph name="information-outline" size={16} color={colors.friend} /><Text style={[type.caption, styles.flex]}>{t("result.explain")}</Text></View>
    </View>}

    {/* ══ 4 · Avaliação e data ══ */}
    {step === 3 && <View style={styles.stack}>
      {summary}
      <RatingControl value={personalRating} onChange={setPersonalRating} showError={showRatingErrors} />
      <DurationField value={duration} onChange={setDuration} showError={showRatingErrors} />
      <View style={styles.card}>
        <View style={styles.rowButton}>
          <Glyph name="calendar-clock" size={20} color={colors.primary} />
          <View style={styles.flex}><Text style={type.caption}>{t("when.title")}</Text><Text style={[type.body, strong]}>{whenText}</Text></View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("when.editLabel")} accessibilityState={{ expanded: editingWhen }} onPress={() => setEditingWhen(v => !v)} style={styles.link}>
            <Text style={styles.linkText}>{editingWhen ? t("when.done") : t("when.edit")}</Text>
          </TouchableOpacity>
        </View>
        {editingWhen && <MatchDateFields value={matchDate} locale={locale} picker={datePicker} onPickerChange={setDatePicker}
          onChange={date => { matchDateEdited.current = true; setMatchDate(date); }} />}
      </View>
      <View style={styles.card}>
        <TouchableOpacity style={styles.rowButton} accessibilityRole="button" accessibilityState={{ expanded: showDetails }} onPress={() => setShowDetails(v => !v)}>
          <Glyph name="text-box-outline" size={20} color={colors.primary} />
          <View style={styles.flex}><Text style={[type.body, strong]}>{t("details.optionalTitle")}</Text>{!showDetails && <Text style={type.caption}>{t("details.optionalSubtitle")}</Text>}</View>
          <Glyph name={showDetails ? "chevron-up" : "chevron-down"} size={22} color={colors.chevron} />
        </TouchableOpacity>
        {showDetails && <View style={{ gap: space.md }}>
          <DetailField label={t("details.locationLabel")} placeholder={t("details.locationPlaceholder")} value={location} onChangeText={setLocation} />
          <DetailField label={t("details.commentsLabel")} placeholder={t("details.commentsPlaceholder")} value={comments} onChangeText={setComments} multiline numberOfLines={3} />
          <DetailField label={t("details.notesLabel")} placeholder={t("details.notesPlaceholder")} value={notes} onChangeText={setNotes} multiline numberOfLines={4} />
          <DetailField label={t("details.tagsLabel")} placeholder={t("details.tagsPlaceholder")} value={tags} onChangeText={setTags} />
          {tags.trim() !== "" && <View style={styles.tags}>{tags.split(",").filter(tag => tag.trim()).map((tag, i) => <View key={i} style={styles.tagChip}><Text style={styles.tagChipText}>#{tag.trim()}</Text></View>)}</View>}
          <Text style={[type.caption, strong, { color: colors.text }]}>{t("photos.label")} {pendingPhotos.length > 0 ? `— ${pendingPhotos.length}/${MAX_PHOTOS}` : ""}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {pendingPhotos.map((uri, pi) => <View key={pi} style={styles.photoThumbWrap}>
              <Image source={{ uri }} style={styles.photoThumb} />
              <TouchableOpacity style={styles.photoRemoveBtn} accessibilityRole="button" accessibilityLabel={t("photos.remove")} onPress={() => handleRemovePendingPhoto(uri)}>
                <Glyph name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>)}
            {pendingPhotos.length < MAX_PHOTOS && <TouchableOpacity style={styles.photoAddBtn} accessibilityRole="button" accessibilityLabel={t("photos.add")} onPress={handlePickPendingPhoto} activeOpacity={0.8}>
              <Glyph name="camera-plus-outline" size={20} color={colors.primary} />
              <Text style={styles.photoAddText}>{t("photos.add")}</Text>
            </TouchableOpacity>}
          </ScrollView>
          <Text style={type.caption}>{t("photos.hint")}</Text>
        </View>}
      </View>
    </View>}

    {/* ══ 5 · Rever ══ */}
    {step === 4 && selectedGame && <View style={styles.stack}>
      <Text style={type.caption}>{t("review.title")}</Text>
      <ReviewSection title={t("review.game")} onFix={() => setStep(0)}>
        <GameSummaryCard game={selectedGame} modeLabel={getModeLabel(gameMode) + (isUnofficial ? ` · ${t("header.unofficialBadge")}` : "")} />
        {selectedExpansions.length > 0 && <SummaryRow label={t("summary.expansions")} value={selectedExpansions.map(e => e.name).join(", ")} />}
        {isUnofficial && <SummaryRow label={t("modes.reasonLabel")} value={unofficialJustification} />}
      </ReviewSection>
      <ReviewSection title={t("review.result")} onFix={() => setStep(2)}>
        <View style={styles.card}>
          <SummaryRow label={t("review.result")} value={resultText} />
          <SummaryRow label={t("review.scores")} value={t(scoresEnabled ? "form.withScores" : "form.withoutScores")} />
        </View>
        <View style={styles.card}>
          <TouchableOpacity accessibilityRole="button" onPress={() => setStep(1)} style={styles.inlineLink}>
            <Text style={styles.linkText}>{t("review.fixPlayers")}</Text>
          </TouchableOpacity>
          {playerState.map(p => <SummaryRow key={p.id} label={p.username || t("sessions.playerNameUnavailable")}
            value={[scoresEnabled ? p.score?.trim() : null, t(`result.${{ Win: "win", Loss: "loss", Draw: "draw", Undefined: "undefined" }[outcomeFor(p.id)]}`)].filter(Boolean).join(" · ")} />)}
        </View>
      </ReviewSection>
      <ReviewSection title={t("review.rating")} onFix={() => setStep(3)}>
        <View style={styles.card}>
          <SummaryRow label={t("rating.title")} value={personalRating === undefined ? "—" : `${new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(personalRating)} / 10`} large />
          <SummaryRow label={t("review.duration")} value={durationReview} />
          <SummaryRow label={t("review.when")} value={whenText} />
          {location.trim() !== "" && <SummaryRow label={t("summary.location")} value={location.trim()} />}
          {!!comments.trim() && <SummaryRow label={t("details.commentsLabel")} value={comments.trim()} />}
          {!!notes.trim() && <SummaryRow label={t("details.notesLabel")} value={notes.trim()} />}
          {!!tags.trim() && <SummaryRow label={t("details.tagsLabel")} value={tags.trim()} />}
          {pendingPhotos.length > 0 && <SummaryRow label={t("photos.label")} value={String(pendingPhotos.length)} />}
        </View>
      </ReviewSection>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>}

    {disableScroll && footer}
  </View>;

  if (disableScroll) return content;
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView ref={scrollRef} keyboardDismissMode="on-drag" contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
        {content}
      </ScrollView>
      {footer}
    </KeyboardAvoidingView>
  );
}

/* ── Sub-components ── */

function ProgressBar({ current, labels }: { current: number; labels: readonly string[] }) {
  const { t } = useTranslation("matches");
  const caption = t("form.stepOf", { current: current + 1, total: labels.length, label: labels[current] });
  return <View style={styles.progress} accessible accessibilityRole="progressbar" accessibilityLabel={caption} accessibilityValue={{ min: 1, max: labels.length, now: current + 1 }}>
    <View style={styles.progressTrack}>{labels.map((label, i) => <View key={label} style={[styles.progressSegment, i <= current && styles.progressDone]} />)}</View>
    <Text style={type.caption}>{caption}</Text>
  </View>;
}

function ReviewSection({ title, onFix, children }: { title: string; onFix: () => void; children: React.ReactNode }) {
  const { t } = useTranslation("matches");
  return <View style={{ gap: space.sm }}>
    <View style={styles.reviewHead}>
      <Text style={type.head}>{title}</Text>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("review.fixLabel", { section: title })} onPress={onFix} style={styles.link}>
        <Text style={styles.linkText}>{t("review.fix")}</Text>
      </TouchableOpacity>
    </View>
    {children}
  </View>;
}

function DetailField({ label, placeholder, value, onChangeText, multiline, numberOfLines }: {
  label: string; placeholder: string; value: string; onChangeText: (v: string) => void; multiline?: boolean; numberOfLines?: number;
}) {
  return <View style={{ gap: 6 }}>
    <Text style={[type.caption, strong]}>{label}</Text>
    <TextInput style={[styles.input, multiline && { minHeight: Math.min(numberOfLines ?? 3, 3) * 22, paddingTop: 10 }]}
      accessibilityLabel={label} placeholder={placeholder} placeholderTextColor={colors.placeholder} value={value} onChangeText={onChangeText}
      multiline={multiline} numberOfLines={numberOfLines} textAlignVertical={multiline ? "top" : "center"} />
  </View>;
}

function SummaryRow({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return <View style={styles.summaryRow}>
    <Text style={[type.caption, styles.flex]}>{label}</Text>
    <Text style={[type.body, strong, styles.summaryValue, large && { fontSize: 18 }]}>{value}</Text>
  </View>;
}

const styles = StyleSheet.create({
  scrollContent: { padding: space.lg, paddingBottom: space.xl, backgroundColor: colors.background },
  page: { backgroundColor: colors.background, gap: space.md },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  inlineHeader: { gap: space.sm },
  stack: { gap: space.md },
  flex: { flex: 1, minWidth: 0 },
  card: { backgroundColor: colors.card, borderRadius: radius.hero, borderCurve: "continuous", borderWidth: 1, borderColor: colors.line, padding: space.md, gap: space.sm },
  label: { ...type.micro, ...strong, letterSpacing: 0.3, textTransform: "uppercase" },
  note: { flexDirection: "row", gap: space.sm, alignItems: "flex-start" },
  inline: { flexDirection: "row", alignItems: "center", gap: 6 },
  warning: { flexDirection: "row", alignItems: "flex-start", gap: 6, backgroundColor: colors.pendingSoft, borderRadius: radius.control, padding: space.sm, borderWidth: 1, borderColor: colors.pendingLine },
  notice: { flexDirection: "row", alignItems: "center", gap: space.sm, padding: space.md, borderRadius: radius.hero, backgroundColor: colors.band, borderWidth: 1, borderColor: colors.line },
  shared: { gap: space.xs, padding: space.md, borderRadius: radius.hero, backgroundColor: colors.pendingSoft, borderWidth: 1, borderColor: colors.pendingLine },
  link: { minHeight: touch, minWidth: touch, justifyContent: "center", alignItems: "flex-end" },
  inlineLink: { minHeight: touch, justifyContent: "center", alignSelf: "flex-start" },
  linkText: { ...type.body, ...strong, color: colors.primary },
  rowButton: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: touch },
  segment: { flexDirection: "row", backgroundColor: colors.track, borderRadius: radius.control, padding: 3, gap: 2 },
  segmentItem: { flex: 1, minHeight: touch, borderRadius: radius.control - 3, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  segmentOn: { backgroundColor: colors.card, shadowColor: "#30283D", shadowOpacity: 0.16, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  segmentDim: { opacity: 0.75 },
  progress: { gap: 6 },
  progressTrack: { flexDirection: "row", gap: 4 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: "#DCD6E2" },
  progressDone: { backgroundColor: colors.primary },
  pickbar: { flexDirection: "row", alignItems: "center", gap: space.sm, paddingBottom: space.sm },
  footer: { padding: space.lg, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.line, gap: space.xs },
  footerInline: { paddingTop: space.md, borderTopWidth: 1, borderTopColor: colors.line, gap: space.xs },
  navRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10 },
  reviewHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: space.md, paddingVertical: 6 },
  summaryValue: { flex: 1.5, textAlign: "right" },
  input: { minHeight: touch + 2, borderWidth: 1, borderColor: colors.line, borderRadius: radius.control, backgroundColor: colors.background, paddingHorizontal: space.md, ...type.body },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tagChip: { backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  tagChipText: { ...type.micro, color: colors.primary, fontWeight: "600" },
  photoThumb: { width: 96, height: 96, borderRadius: 12, backgroundColor: colors.line },
  photoThumbWrap: { position: "relative", marginRight: 12 },
  photoRemoveBtn: { position: "absolute", top: 0, right: 0, width: touch, height: touch, borderRadius: touch / 2, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.75)" },
  photoAddBtn: { width: 96, height: 96, borderRadius: 12, borderWidth: 1, borderColor: colors.primary, alignItems: "center", justifyContent: "center", backgroundColor: colors.primarySoft },
  photoAddText: { ...type.caption, color: colors.primary, fontWeight: "700", marginTop: 4 },
  errorText: { color: colors.danger, fontWeight: "700", textAlign: "center", marginTop: 10, fontSize: 14 },
  noticeWarn: { backgroundColor: colors.pendingSoft, borderRadius: 14, padding: 16, margin: 16, borderWidth: 1, borderColor: colors.pendingLine, alignItems: "center" },
  noticeDanger: { backgroundColor: colors.dangerSoft, borderRadius: 14, padding: 16, margin: 16, borderWidth: 1, borderColor: "#f5c6cb", alignItems: "center" },
  noticeTitle: { fontWeight: "800", color: colors.text, fontSize: 16, marginBottom: 8, textAlign: "center" },
  noticeText: { color: colors.muted, fontWeight: "600", textAlign: "center", marginTop: 4 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: 10 },
  modalDesc: { fontSize: 14, color: colors.muted, lineHeight: 20, marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: "700", color: colors.text, marginBottom: 6 },
  modalInput: { minHeight: 100, borderWidth: 1, borderColor: colors.line, borderRadius: radius.control, padding: space.md, textAlignVertical: "top", ...type.body },
  modalHint: { fontSize: 11, color: colors.muted, textAlign: "right", marginTop: 4, marginBottom: 16 },
  modalActions: { flexDirection: "row", gap: 10 },
  modalCancelBtn: { flex: 1, minHeight: touch, borderRadius: radius.control, alignItems: "center", justifyContent: "center", backgroundColor: colors.primarySoft },
  modalCancelText: { color: colors.muted, fontWeight: "600" },
  modalConfirmBtn: { flex: 1, minHeight: touch, borderRadius: radius.control, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary },
  modalConfirmText: { color: "#fff", fontWeight: "700" },
});
