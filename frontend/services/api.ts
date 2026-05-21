// frontend/services/api.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: `${API_URL}/api/`,
});

export const updateMatchResult = async (
  matchId: number, 
  score1: number | null, 
  score2: number | null,
  penalties1?: number | null,
  penalties2?: number | null
) => {
  // A regra de negócio: a partida só é considerada finalizada (played=True) 
  // se o usuário tiver preenchido o placar de AMBAS as seleções.
  const isPlayed = score1 !== null && score2 !== null;

  try {
    const response = await api.patch(`matches/${matchId}/`, {
      score1: score1,
      score2: score2,
      penalties_score1: penalties1 ?? null,
      penalties_score2: penalties2 ?? null,
      played: isPlayed
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar a partida:", error);
    throw error;
  }
};

export const generateKnockout = async () => {
  try {
    const response = await api.post('generate-knockout/');
    return response.data;
  } catch (error) {
    console.error("Erro ao gerar chaveamento:", error);
    throw error;
  }
};

export const simulateKnockout = async () => {
  try {
    const response = await api.post('simulate-knockout/');
    return response.data;
  } catch (error) {
    console.error("Erro ao simular chaveamento:", error);
    throw error;
  }
};