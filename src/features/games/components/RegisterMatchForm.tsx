import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  ActivityIndicator, Image, Platform, StyleSheet, ScrollView, Modal,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

import { useRegisterMatch } from "../hooks/useRegisterMatch";
import sessionService from "../services/sessionService";
import { toMatchPlayerDto } from "../../users/utils/playerMappers";
import { GameSelector } from "../components/GameSelector";
import { ExpansionSelector } from "../components/ExpansionSelector";
import PlayerSelector from "../../users/components/PlayerSelector";
import { StarRating } from "../components/StarRating";

import { Game } from "../types/Game";
import { MatchFormData } from "../types/MatchForm";
import { PlayerState } from "../../users/types/PlayerState";
import { COLORS } from "@/src/constants/colors";
import { useFriends } from "../../friends/hooks/useFriends";
import { GameSession } from "../types/GameSession";
import { sessionPlayerGuards } from "../types/GameSessionPlayer";
import { User } from "../../users/types/User";
import {
  getAvailableModes, getDefaultMode, getModesDescription,
  GameMode, AvailableModes,
} from "../types/GameSuggestion";

type SoloResult = "player_win" | "game_win" | "none";

type Props = {
  sessionId?: string;
  currentUser?: { id: string; userName: string };
  disableScroll?: boolean;
};

const STEPS = ["Jogo", "Modo", "Jogadores", "Detalhes"] as const;
type Step = 0 | 1 | 2 | 3;

export default function RegisterMatchForm({ sessionId, currentUser, disableScroll = false }: Props) {
  const isSessionMatch = !!sessionId;
  const { submitMatch, loading, error } = useRegisterMatch();
  const { friends, loading: friendsLoading } = useFriends();

  const [session, setSession] = useState<GameSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [step, setStep] = useState<Step>(0);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [editingGame, setEditingGame] = useState(true);
  const [selectedExpansions, setSelectedExpansions] = useState<Game[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>("multiplayer");
  const [soloResult, setSoloResult] = useState<SoloResult>("none");
  const [playerState, setPlayerState] = useState<PlayerState[]>([]);
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState("");
  const [comments, setComments] = useState("");

  // ── Diário ──────────────────────────────────────────────────────────────
  const [personalRating, setPersonalRating] = useState<number | undefined>();
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");

  // ── Modo não oficial ─────────────────────────────────────────────────────
  const [unofficialMode, setUnofficialMode] = useState<GameMode | null>(null);
  const [unofficialJustification, setUnofficialJustification] = useState("");
  const [showUnofficialModal, setShowUnofficialModal] = useState(false);
  const [pendingUnofficialMode, setPendingUnofficialMode] = useState<GameMode | null>(null);

  /* ── Load session ── */
  useEffect(() => {
    let mounted = true;
    async function loadSession() {
      if (!sessionId) { setSession(null); return; }
      try {
        setSessionLoading(true);
        const data = await sessionService.getById(sessionId);
        if (mounted) setSession(data);
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

  /* ── Available modes ── */
  const availableModes = useMemo((): AvailableModes => {
    if (!selectedGame) return {
      solo:        { available: true,  source: null, label: "Solo",        icon: "person"   },
      multiplayer: { available: true,  source: null, label: "Multiplayer", icon: "people"   },
      cooperative: { available: false, source: null, label: "Cooperativo", icon: "favorite" },
    };
    const expansion = selectedExpansions[0] ?? null;
    return getAvailableModes(selectedGame, expansion);
  }, [selectedGame, selectedExpansions]);

  useEffect(() => {
    if (!selectedGame) return;
    const expansion = selectedExpansions[0] ?? null;
    const best = getDefaultMode(selectedGame, expansion);
    setGameMode(best);
    setUnofficialMode(null);
    setUnofficialJustification("");
    setSoloResult("none");
  }, [selectedGame?.id, selectedExpansions]);

  const isSolo = gameMode === "solo";
  const isCooperative = gameMode === "cooperative";
  const isUnofficial = unofficialMode === gameMode;

  useEffect(() => {
    if (isSolo && currentUser?.id) {
      setPlayerState([{ id: currentUser.id, username: currentUser.userName, score: "", isWinner: false }]);
    }
  }, [isSolo, currentUser]);

  /* ── Modo não oficial ── */
  const handleModePress = (mode: GameMode) => {
    const info = availableModes[mode];
    if (info.available) {
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
    if (!pendingUnofficialMode || unofficialJustification.trim().length < 5) return;
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

  /* ── Navigation ── */
  const canGoNext = (): boolean => {
    if (step === 0) return !!selectedGame && !editingGame;
    if (step === 1) return true;
    if (step === 2) return playerState.length > 0;
    return true;
  };

  const goNext = () => { if (step < 3 && canGoNext()) setStep((s) => (s + 1) as Step); };
  const goPrev = () => { if (step > 0) setStep((s) => (s - 1) as Step); };

  const clearAll = () => {
    setSelectedGame(null); setSelectedExpansions([]); setPlayerState([]);
    setLocation(""); setDuration(""); setComments("");
    setPersonalRating(undefined); setNotes(""); setTags("");
    setUnofficialMode(null); setUnofficialJustification("");
    setEditingGame(true); setGameMode("multiplayer"); setSoloResult("none"); setStep(0);
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!selectedGame) return Alert.alert("Erro", "Seleciona um jogo.");
    if (playerState.length === 0) return Alert.alert("Erro", "Adiciona pelo menos 1 jogador.");

    const dur = duration.trim() ? Number(duration) : undefined;
    if (dur !== undefined && (Number.isNaN(dur) || dur <= 0))
      return Alert.alert("Erro", "A duração tem de ser um número positivo.");

    let winnerId: string | undefined;
    if (isSolo) {
      if (soloResult === "player_win" && currentUser?.id) winnerId = currentUser.id;
    } else if (isCooperative) {
      winnerId = undefined;
    } else {
      const winner = playerState.find((p) => p.isWinner);
      if (playerState.length > 1 && !winner)
        return Alert.alert("Erro", "Seleciona o vencedor da partida.");
      winnerId = winner?.id;
    }

    const payload: MatchFormData = {
      gameId: selectedGame.id,
      gameName: selectedGame.name,
      matchDate: new Date().toISOString(),
      location: location.trim() || undefined,
      durationInMinutes: dur,
      scoreSummary: comments.trim() || undefined,
      isSoloGame: isSolo,
      players: toMatchPlayerDto(playerState),
      winnerId,
      expansions: selectedExpansions.map((e) => ({ bggId: e.bggId!, name: e.name })),
      sessionId: sessionId || undefined,
      personalRating,
      notes: notes.trim() || undefined,
      tags: tags.trim() || undefined,
      unofficialModeJustification: isUnofficial ? unofficialJustification : undefined,
      // ⚠️ Sem campaignId — partidas rápidas não se associam a campanhas
    };

    const created = await submitMatch(payload);
    if (created) {
      Alert.alert(
        "✅ Partida registada!",
        isSessionMatch ? "Partida adicionada à sessão." : "Partida guardada com sucesso.",
        [{ text: "OK", onPress: clearAll }]
      );
    }
  };

  /* ── Session Guards ── */
  if (isSessionMatch && sessionLoading)
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  if (isSessionMatch && !sessionLoading && !session)
    return (
      <View style={styles.noticeDanger}>
        <Text style={styles.noticeTitle}>⚠️ Sessão não encontrada</Text>
        <Text style={styles.noticeText}>Volta atrás e tenta novamente.</Text>
      </View>
    );

  if (isSessionMatch && session && !sessionIsActive) {
    const when = session.scheduledStartDate ? new Date(session.scheduledStartDate).toLocaleString() : "—";
    return (
      <View style={styles.noticeWarn}>
        <Text style={styles.noticeTitle}>
          {session.status === "Upcoming" ? "⏳ Sessão ainda não começou" : "🔒 Sessão encerrada"}
        </Text>
        <Text style={styles.noticeText}>🗓 {when}</Text>
        <Text style={styles.noticeText}>Regista partidas quando a sessão estiver Ativa.</Text>
      </View>
    );
  }

  if (isSessionMatch && session && acceptedUsersFromSession.length === 0)
    return (
      <View style={styles.noticeWarn}>
        <Text style={styles.noticeTitle}>👥 Sem participantes aceites</Text>
        <Text style={styles.noticeText}>Aguarda que os convidados aceitem para poderes registar partidas.</Text>
      </View>
    );

  const soloAvailable = availableModes.solo.available;
  const multiAvailable = availableModes.multiplayer.available;
  const coopAvailable = availableModes.cooperative.available;

  const content = (
    <View style={disableScroll ? undefined : { flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {isSessionMatch ? "Adicionar Partida" : "Registar Partida"}
        </Text>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, isSessionMatch ? styles.badgeSession : styles.badgeQuick]}>
            <Text style={[styles.badgeText, isSessionMatch ? styles.badgeSessionText : styles.badgeQuickText]}>
              {isSessionMatch ? "SESSÃO" : "QUICK"}
            </Text>
          </View>
          {isUnofficial && (
            <View style={styles.unofficialBadge}>
              <Text style={styles.unofficialBadgeText}>⚠️ Não oficial</Text>
            </View>
          )}
        </View>
      </View>

      <ProgressBar current={step} total={STEPS.length} labels={STEPS} />

      {/* ══ STEP 0: Jogo ══ */}
      {step === 0 && (
        <View style={styles.card}>
          <SectionTitle icon="sports-esports" label="Escolhe o jogo" />
          {editingGame ? (
            <GameSelector onSelect={(game) => { setSelectedGame(game); setSelectedExpansions([]); setEditingGame(false); }} />
          ) : (
            <View>
              <View style={styles.gameRow}>
                {selectedGame?.imageUrl ? (
                  <Image source={{ uri: selectedGame.imageUrl }} style={styles.gameThumb} />
                ) : (
                  <View style={[styles.gameThumb, styles.gameThumbPlaceholder]}>
                    <MaterialIcons name="sports-esports" size={28} color={COLORS.primary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.gameName}>{selectedGame?.name}</Text>
                  <Text style={styles.gameMeta}>
                    {[
                      selectedGame?.yearPublished,
                      selectedGame?.averageRating ? `⭐ ${selectedGame.averageRating.toFixed(1)}` : null,
                      selectedGame?.minPlayers != null && selectedGame?.maxPlayers != null
                        ? `👥 ${selectedGame.minPlayers}–${selectedGame.maxPlayers}` : null,
                    ].filter(Boolean).join(" · ")}
                  </Text>
                  {selectedGame && (
                    <View style={styles.modeBadgesRow}>
                      {soloAvailable && <View style={[styles.modeBadge, { backgroundColor: COLORS.success + "20" }]}><Text style={[styles.modeBadgeText, { color: COLORS.success }]}>Solo</Text></View>}
                      {multiAvailable && <View style={[styles.modeBadge, { backgroundColor: COLORS.primary + "20" }]}><Text style={[styles.modeBadgeText, { color: COLORS.primary }]}>Multi</Text></View>}
                      {coopAvailable && <View style={[styles.modeBadge, { backgroundColor: COLORS.secondary + "20" }]}><Text style={[styles.modeBadgeText, { color: COLORS.secondary }]}>Coop</Text></View>}
                    </View>
                  )}
                </View>
                <TouchableOpacity onPress={() => setEditingGame(true)} style={styles.changeBtn}>
                  <Text style={styles.changeBtnText}>Mudar</Text>
                </TouchableOpacity>
              </View>
              {selectedGame && (
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.subLabel}>Expansões utilizadas (opcional)</Text>
                  <ExpansionSelector baseGameId={selectedGame.id} selectedExpansions={selectedExpansions} onChange={setSelectedExpansions} />
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* ══ STEP 1: Modo ══ */}
      {step === 1 && (
        <View style={styles.card}>
          <SectionTitle icon="gamepad" label="Modo de jogo" />
          {selectedGame && (
            <View style={styles.gameInfoBox}>
              <Text style={styles.gameInfoName}>{selectedGame.name}</Text>
              <Text style={styles.gameInfoMeta}>
                {[
                  selectedGame.minPlayers != null && selectedGame.maxPlayers != null
                    ? `👥 ${selectedGame.minPlayers}–${selectedGame.maxPlayers} jogadores` : null,
                  getModesDescription(selectedGame, selectedExpansions[0] ?? null),
                ].filter(Boolean).join("  ·  ")}
              </Text>
              {selectedExpansions.length > 0 && (
                <Text style={styles.expansionNote}>
                  📦 Com expansão: {selectedExpansions[0]?.name}
                  {availableModes.solo.source === "expansion" ? " → Solo desbloqueado!" : ""}
                  {availableModes.cooperative.source === "expansion" ? " → Coop desbloqueado!" : ""}
                </Text>
              )}
            </View>
          )}

          <View style={styles.modeRow}>
            {([
              { mode: "solo" as GameMode,        icon: "person",   label: "Solo",        color: COLORS.success   },
              { mode: "multiplayer" as GameMode, icon: "people",   label: "Multiplayer", color: COLORS.primary   },
              { mode: "cooperative" as GameMode, icon: "favorite", label: "Cooperativo", color: COLORS.secondary },
            ]).map(({ mode, icon, label, color }) => {
              const info = availableModes[mode];
              const isActive = gameMode === mode;
              const isActiveUnofficial = isActive && unofficialMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeBtn, isActive && { borderColor: color, backgroundColor: color + "18" }, !info.available && styles.modeBtnUnavailable]}
                  onPress={() => handleModePress(mode)} activeOpacity={0.8}
                >
                  <MaterialIcons name={icon as any} size={24} color={isActive ? color : !info.available ? "#ccc" : "#aaa"} />
                  <Text style={[styles.modeBtnLabel, isActive && { color }, !info.available && { color: "#ccc" }]}>{label}</Text>
                  {info.available && info.source && (
                    <View style={[styles.sourceBadge, info.source === "bgg_official" && styles.sourceBadgeOfficial, info.source === "expansion" && styles.sourceBadgeExpansion]}>
                      <Text style={[styles.sourceBadgeText, info.source === "bgg_official" && { color: COLORS.success }, info.source === "expansion" && { color: "#1E88E5" }]}>
                        {info.source === "bgg_official" ? "✅ Confirmado" : "📦 Exp"}
                      </Text>
                    </View>
                  )}
                  {!info.available && <View style={styles.forceBadge}><Text style={styles.forceBadgeText}>+ Forçar</Text></View>}
                  {isActiveUnofficial && <View style={styles.unofficialSmallBadge}><Text style={styles.unofficialSmallBadgeText}>⚠️</Text></View>}
                </TouchableOpacity>
              );
            })}
          </View>

          {isUnofficial && (
            <View style={styles.unofficialWarning}>
              <MaterialIcons name="warning" size={14} color="#f39c12" />
              <Text style={styles.unofficialWarningText}>
                Modo não oficial — esta partida não vai contar para rankings ou ratings.{"\n"}
                Justificação: "{unofficialJustification}"
              </Text>
            </View>
          )}

          {isSolo && (
            <View style={{ marginTop: 20 }}>
              <Text style={styles.subLabel}>Resultado</Text>
              <View style={styles.resultRow}>
                <ResultButton emoji="🏆" label="Ganhei"        active={soloResult === "player_win"} activeColor={COLORS.success} onPress={() => setSoloResult("player_win")} />
                <ResultButton emoji="💀" label="O jogo ganhou" active={soloResult === "game_win"}   activeColor={COLORS.error}   onPress={() => setSoloResult("game_win")} />
                <ResultButton emoji="—"  label="Sem resultado" active={soloResult === "none"}        activeColor="#888"           onPress={() => setSoloResult("none")} />
              </View>
            </View>
          )}

          {isCooperative && (
            <View style={{ marginTop: 20 }}>
              <Text style={styles.subLabel}>Resultado da equipa</Text>
              <View style={styles.resultRow}>
                <ResultButton emoji="🏆" label="Ganhámos"
                  active={playerState.length > 0 && playerState.every((p) => p.isWinner)} activeColor={COLORS.success}
                  onPress={() => setPlayerState((prev) => prev.map((p) => ({ ...p, isWinner: true })))} />
                <ResultButton emoji="💀" label="Perdemos"
                  active={playerState.length > 0 && playerState.every((p) => !p.isWinner)} activeColor={COLORS.error}
                  onPress={() => setPlayerState((prev) => prev.map((p) => ({ ...p, isWinner: false })))} />
              </View>
            </View>
          )}

          {/* Modal modo não oficial — sem referência ao BGG */}
          <Modal visible={showUnofficialModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>⚠️ Modo não confirmado</Text>
                <Text style={styles.modalDesc}>
                  Não temos informação de que este jogo suporte o modo{" "}
                  <Text style={{ fontWeight: "800" }}>
                    {pendingUnofficialMode === "solo" ? "Solo"
                      : pendingUnofficialMode === "cooperative" ? "Cooperativo"
                      : "Multiplayer"}
                  </Text>.{" "}
                  Podes forçá-lo, mas esta partida{" "}
                  <Text style={{ fontWeight: "800", color: COLORS.error }}>
                    não vai contar para rankings ou ratings.
                  </Text>
                </Text>
                <Text style={styles.modalLabel}>Porque estás a usar este modo? *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={unofficialJustification}
                  onChangeText={setUnofficialJustification}
                  placeholder="Ex: Variante fan-made, regra da casa, adaptação..."
                  placeholderTextColor="#bbb"
                  multiline numberOfLines={3}
                  textAlignVertical="top"
                  maxLength={200}
                />
                <Text style={styles.modalHint}>{unofficialJustification.length}/200</Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={handleCancelUnofficial}>
                    <Text style={styles.modalCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalConfirmBtn, unofficialJustification.trim().length < 5 && { opacity: 0.4 }]}
                    onPress={handleConfirmUnofficial}
                    disabled={unofficialJustification.trim().length < 5}
                  >
                    <Text style={styles.modalConfirmText}>Usar mesmo assim</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      )}

      {/* ══ STEP 2: Jogadores ══ */}
      {step === 2 && (
        <View style={styles.card}>
          <SectionTitle icon="people" label={isSolo ? "Jogador" : isCooperative ? "Equipa" : "Jogadores"} />
          {isSolo ? (
            <View>
              <View style={styles.soloPlayerRow}>
                <View style={styles.playerAvatar}>
                  <Text style={styles.playerAvatarText}>{(currentUser?.userName ?? "?")[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.playerName}>{currentUser?.userName ?? "Tu"}</Text>
                  <Text style={styles.playerSub}>Pontuação final (opcional)</Text>
                </View>
                <TextInput
                  style={styles.scoreInput}
                  value={playerState[0]?.score ?? ""}
                  onChangeText={(v) => setPlayerState([{ id: currentUser!.id, username: currentUser!.userName, score: v, isWinner: false }])}
                  keyboardType="numeric" placeholder="—" placeholderTextColor="#aaa"
                />
              </View>
              <View style={styles.soloResultSummary}>
                <Text style={styles.soloResultLabel}>Resultado:</Text>
                <Text style={styles.soloResultValue}>
                  {soloResult === "player_win" ? "🏆 Ganhei" : soloResult === "game_win" ? "💀 O jogo ganhou" : "— Sem resultado"}
                </Text>
              </View>
            </View>
          ) : !isSessionMatch && friendsLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
            <PlayerSelector
              users={availableUsers} players={playerState} onChange={setPlayerState}
              currentUser={currentUserForSelector} lockCurrentUser={!isSessionMatch}
              mode={isSessionMatch ? "session" : "quick"} maxResults={12}
            />
          )}
        </View>
      )}

      {/* ══ STEP 3: Detalhes ══ */}
      {step === 3 && (
        <View>
          {/* Detalhes básicos */}
          <View style={styles.card}>
            <SectionTitle icon="info" label="Detalhes opcionais" />
            <DetailField label="📍 Local" placeholder="Ex: Casa do João, LeiriaCon..." value={location} onChangeText={setLocation} />
            <DetailField label="⏱ Duração (minutos)" placeholder="Ex: 90" value={duration} onChangeText={setDuration} keyboardType="numeric" />
            <DetailField label="📝 Comentários" placeholder="Ex: Partida renhida, reviravolta no fim!" value={comments} onChangeText={setComments} multiline numberOfLines={3} />
          </View>

          {/* Diário de partida — com StarRating */}
          <View style={styles.card}>
            <SectionTitle icon="auto-stories" label="Diário de partida" />

            <Text style={styles.subLabel}>A tua avaliação (0–10)</Text>
            <StarRating value={personalRating} onChange={setPersonalRating} size={30} />

            <View style={{ marginTop: 16 }}>
              <DetailField
                label="📖 Notas (momentos épicos, estratégias...)"
                placeholder="Ex: Última ronda incrível, estratégia funcionou!"
                value={notes} onChangeText={setNotes} multiline numberOfLines={4}
              />
              <DetailField
                label="🏷️ Tags (separadas por vírgula)"
                placeholder="Ex: épico, reviravolta, difícil"
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
          </View>

          {/* Resumo */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>📋 Resumo da partida</Text>
            <SummaryRow label="Jogo" value={selectedGame?.name ?? "—"} />
            <SummaryRow label="Modo" value={`${gameMode === "solo" ? "Solo" : gameMode === "cooperative" ? "Cooperativo" : "Multiplayer"}${isUnofficial ? " ⚠️" : ""}`} />
            {isSolo && (
              <SummaryRow label="Resultado" value={soloResult === "player_win" ? "🏆 Ganhei" : soloResult === "game_win" ? "💀 O jogo ganhou" : "— Sem resultado"} />
            )}
            {!isSolo && (
              <SummaryRow
                label={isCooperative ? "Resultado equipa" : "Vencedor"}
                value={isCooperative
                  ? playerState.some((p) => p.isWinner) ? "🏆 Ganhámos" : "💀 Perdemos"
                  : playerState.find((p) => p.isWinner)?.username ?? "Não definido"}
              />
            )}
            <SummaryRow label="Jogadores" value={`${playerState.length}`} />
            {selectedExpansions.length > 0 && <SummaryRow label="Expansões" value={selectedExpansions.map((e) => e.name).join(", ")} />}
            {location.trim() !== "" && <SummaryRow label="Local" value={location} />}
            {duration.trim() !== "" && <SummaryRow label="Duração" value={`${duration} min`} />}
            {personalRating !== undefined && <SummaryRow label="Avaliação" value={`${personalRating}/10`} />}
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      )}

      {!disableScroll && <View style={{ height: 100 }} />}

      <View style={disableScroll ? styles.navRowInline : styles.stickyBar}>
        <View style={styles.navRow}>
          {step > 0 ? (
            <TouchableOpacity style={styles.backBtn} onPress={goPrev}>
              <MaterialIcons name="arrow-back" size={20} color={COLORS.primary} />
              <Text style={styles.backBtnText}>Voltar</Text>
            </TouchableOpacity>
          ) : <View style={{ flex: 1 }} />}

          {step < 3 ? (
            <TouchableOpacity style={[styles.nextBtn, !canGoNext() && styles.nextBtnDisabled]} onPress={goNext} disabled={!canGoNext()}>
              <Text style={styles.nextBtnText}>Continuar</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <><Ionicons name="checkmark-circle" size={20} color="#fff" /><Text style={styles.saveBtnText}>Guardar Partida</Text></>
              }
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  if (disableScroll) return content;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
        {content}
      </ScrollView>
    </View>
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
    <TouchableOpacity style={[styles.resultBtn, active && { borderColor: activeColor, backgroundColor: activeColor + "18" }]} onPress={onPress} activeOpacity={0.8}>
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
        style={[styles.detailInput, multiline && { height: (numberOfLines ?? 3) * 26, paddingTop: 10 }]}
        placeholder={placeholder} placeholderTextColor="#aaa" value={value} onChangeText={onChangeText}
        keyboardType={keyboardType ?? "default"} multiline={multiline} numberOfLines={numberOfLines}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 20, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.primary },
  badgeRow: { flexDirection: "row", marginTop: 6, gap: 8, flexWrap: "wrap" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeQuick: { backgroundColor: COLORS.primary + "18" },
  badgeSession: { backgroundColor: COLORS.secondary + "18" },
  badgeText: { fontSize: 11, fontWeight: "800" },
  badgeQuickText: { color: COLORS.primary },
  badgeSessionText: { color: COLORS.secondary },
  unofficialBadge: { backgroundColor: "#fff8e1", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: "#ffe082" },
  unofficialBadgeText: { fontSize: 11, fontWeight: "700", color: "#f39c12" },

  progressContainer: { flexDirection: "row", alignItems: "flex-start", marginBottom: 20 },
  progressStep: { alignItems: "center", gap: 4 },
  progressDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#e0e0e0", alignItems: "center", justifyContent: "center" },
  progressDotDone: { backgroundColor: COLORS.success },
  progressDotActive: { backgroundColor: COLORS.primary },
  progressDotText: { fontSize: 12, fontWeight: "700", color: "#888" },
  progressDotTextActive: { color: "#fff" },
  progressLabel: { fontSize: 10, color: "#aaa", marginTop: 2, textAlign: "center" },
  progressLabelActive: { color: COLORS.primary, fontWeight: "700" },
  progressLabelDone: { color: COLORS.success },
  progressLine: { flex: 1, height: 2, backgroundColor: "#e0e0e0", alignSelf: "flex-start", marginTop: 13, marginBottom: 16, marginHorizontal: 2 },
  progressLineDone: { backgroundColor: COLORS.success },

  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#eee", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionTitleText: { fontSize: 15, fontWeight: "800", color: COLORS.onBackground },

  gameRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  gameThumb: { width: 60, height: 60, borderRadius: 10, backgroundColor: "#f0f0f0" },
  gameThumbPlaceholder: { alignItems: "center", justifyContent: "center" },
  gameName: { fontSize: 16, fontWeight: "800", color: COLORS.onBackground },
  gameMeta: { fontSize: 12, color: "#888", marginTop: 3 },
  modeBadgesRow: { flexDirection: "row", gap: 4, marginTop: 6, flexWrap: "wrap" },
  modeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  modeBadgeText: { fontSize: 11, fontWeight: "700" },
  changeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "#f4f4f4" },
  changeBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  subLabel: { fontSize: 13, fontWeight: "700", color: COLORS.onBackground, marginBottom: 8 },

  gameInfoBox: { backgroundColor: "#f4f7ff", borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: COLORS.primary + "20" },
  gameInfoName: { fontSize: 14, fontWeight: "800", color: COLORS.onBackground, marginBottom: 2 },
  gameInfoMeta: { fontSize: 12, color: "#666" },
  expansionNote: { fontSize: 11, color: "#1E88E5", marginTop: 4, fontWeight: "600" },

  modeRow: { flexDirection: "row", gap: 8 },
  modeBtn: { flex: 1, alignItems: "center", paddingVertical: 14, paddingHorizontal: 4, borderRadius: 12, borderWidth: 1.5, borderColor: "#e0e0e0", backgroundColor: "#fafafa", gap: 4 },
  modeBtnUnavailable: { backgroundColor: "#f5f5f5", borderColor: "#eee", borderStyle: "dashed" },
  modeBtnLabel: { fontSize: 11, fontWeight: "700", color: "#aaa", textAlign: "center" },
  sourceBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 999, marginTop: 2 },
  sourceBadgeOfficial: { backgroundColor: "#E8F5E9" },
  sourceBadgeExpansion: { backgroundColor: "#E3F2FD" },
  sourceBadgeText: { fontSize: 9, fontWeight: "700" },
  forceBadge: { backgroundColor: "#f0f0f0", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, marginTop: 2 },
  forceBadgeText: { fontSize: 9, fontWeight: "700", color: "#888" },
  unofficialSmallBadge: { position: "absolute", top: 4, right: 4 },
  unofficialSmallBadgeText: { fontSize: 10 },
  unofficialWarning: { flexDirection: "row", alignItems: "flex-start", gap: 6, backgroundColor: "#fff8e1", borderRadius: 10, padding: 10, marginTop: 10, borderWidth: 1, borderColor: "#ffe082" },
  unofficialWarningText: { flex: 1, fontSize: 11, color: "#856404", lineHeight: 16 },

  resultRow: { flexDirection: "row", gap: 8 },
  resultBtn: { flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: "#e0e0e0", backgroundColor: "#fafafa", gap: 4 },
  resultEmoji: { fontSize: 22 },
  resultLabel: { fontSize: 11, fontWeight: "600", color: "#888", textAlign: "center" },

  soloPlayerRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: "#f9f9f9", borderRadius: 12, borderWidth: 1, borderColor: "#eee" },
  playerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary + "20", alignItems: "center", justifyContent: "center" },
  playerAvatarText: { fontSize: 16, fontWeight: "800", color: COLORS.primary },
  playerName: { fontSize: 15, fontWeight: "700", color: COLORS.onBackground },
  playerSub: { fontSize: 12, color: "#888", marginTop: 2 },
  scoreInput: { width: 72, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 10, textAlign: "center", fontSize: 16, fontWeight: "700", backgroundColor: "#fff", color: COLORS.onBackground },
  soloResultSummary: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, padding: 12, backgroundColor: "#f0f4ff", borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary + "30" },
  soloResultLabel: { fontSize: 13, color: "#666", fontWeight: "600" },
  soloResultValue: { fontSize: 14, fontWeight: "800", color: COLORS.onBackground },

  detailField: { marginBottom: 12 },
  detailLabel: { fontSize: 13, fontWeight: "700", color: COLORS.onBackground, marginBottom: 6 },
  detailInput: { borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 12, fontSize: 14, backgroundColor: "#fff", color: COLORS.onBackground },

  tagsPreviewRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  tagChip: { backgroundColor: COLORS.primary + "14", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  tagChipText: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },

  summaryCard: { backgroundColor: "#f7f9ff", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.primary + "30" },
  summaryTitle: { fontSize: 14, fontWeight: "800", color: COLORS.primary, marginBottom: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: "#e0e8f4" },
  summaryLabel: { fontSize: 13, color: "#888", fontWeight: "600", flex: 1 },
  summaryValue: { fontSize: 13, color: COLORS.onBackground, fontWeight: "700", flex: 1.5, textAlign: "right" },

  errorText: { color: COLORS.error, fontWeight: "700", textAlign: "center", marginTop: 10, fontSize: 14 },

  stickyBar: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, paddingBottom: Platform.OS === "ios" ? 28 : 16, backgroundColor: "rgba(255,255,255,0.96)", borderTopWidth: 1, borderTopColor: "#eee" },
  navRowInline: { paddingHorizontal: 0, paddingTop: 12, paddingBottom: 4, borderTopWidth: 1, borderTopColor: "#eee", marginTop: 8 },
  navRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary + "40", backgroundColor: "#fff" },
  backBtnText: { fontSize: 14, fontWeight: "700", color: COLORS.primary },
  nextBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.primary },
  nextBtnDisabled: { backgroundColor: "#ccc" },
  nextBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
  saveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.success },
  saveBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },

  noticeWarn: { backgroundColor: "#fff3cd", borderRadius: 14, padding: 16, margin: 16, borderWidth: 1, borderColor: "#ffeeba", alignItems: "center" },
  noticeDanger: { backgroundColor: "#f8d7da", borderRadius: 14, padding: 16, margin: 16, borderWidth: 1, borderColor: "#f5c6cb", alignItems: "center" },
  noticeTitle: { fontWeight: "800", color: "#333", fontSize: 16, marginBottom: 8, textAlign: "center" },
  noticeText: { color: "#555", fontWeight: "600", textAlign: "center", marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalBox: { backgroundColor: "#fff", borderRadius: 20, padding: 24, width: "100%" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#333", marginBottom: 10 },
  modalDesc: { fontSize: 14, color: "#555", lineHeight: 20, marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: "700", color: "#333", marginBottom: 6 },
  modalInput: { borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 12, fontSize: 14, height: 80, backgroundColor: "#fafafa", color: "#333" },
  modalHint: { fontSize: 11, color: "#bbb", textAlign: "right", marginTop: 4, marginBottom: 16 },
  modalActions: { flexDirection: "row", gap: 10 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: "#ddd", alignItems: "center" },
  modalCancelText: { color: "#666", fontWeight: "600" },
  modalConfirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: "#f39c12", alignItems: "center" },
  modalConfirmText: { color: "#fff", fontWeight: "700" },

  hint: { fontSize: 11, color: "#888", fontStyle: "italic", marginTop: 10, textAlign: "center", lineHeight: 16 },
});