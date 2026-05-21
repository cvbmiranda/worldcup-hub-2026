from rest_framework import generics
from .models import Group, Team, Match
from .serializers import GroupSerializer, TeamSerializer, MatchSerializer
from .services import update_group_standings, calculate_group_positions

class GroupListView(generics.ListAPIView):
    queryset = Group.objects.all().order_by('name')
    serializer_class = GroupSerializer

class TeamListView(generics.ListAPIView):
    queryset = Team.objects.all().order_by('name')
    serializer_class = TeamSerializer

class MatchListView(generics.ListAPIView):
    queryset = Match.objects.all().order_by('id')
    serializer_class = MatchSerializer

class MatchUpdateView(generics.UpdateAPIView):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer

    def perform_update(self, serializer):
        # 1. Salva o novo placar e status da partida no banco
        match = serializer.save()
        
        # 2. Se a partida pertence à fase de grupos e foi concluída, roda o recálculo
        if match.group and match.played:
            update_group_standings(match.group.id)
            calculate_group_positions()
            
        # 3. Se a partida pertence ao mata-mata e foi concluída, avança o vencedor
        if match.played and match.stage != Match.Stage.GROUP:
            winner = match.get_winner()
            if winner:
                # Checa se esta partida tem um caminho para a próxima fase
                if hasattr(match, 'knockout') and match.knockout.next_match:
                    next_match = match.knockout.next_match
                    
                    # Para ser determinístico, verificamos se o time1 está vazio.
                    # Se estiver, o vencedor entra como mandante. Se não, como visitante.
                    # Mas se o vencedor JÁ estiver num dos slots, ignoramos para não duplicar.
                    if next_match.team1 != winner and next_match.team2 != winner:
                        if next_match.team1 is None:
                            next_match.team1 = winner
                        elif next_match.team2 is None:
                            next_match.team2 = winner
                        else:
                            # Se ambos os slots estiverem preenchidos (re-simulação),
                            # temos que descobrir qual slot essa partida de origem alimenta.
                            # Para simplificar, se já estiver cheio, apenas assumimos que 
                            # a chave mudou e forçamos a atualização do slot correto.
                            # Como temos 2 previous_matches apontando para o next_match:
                            prev_matches = list(next_match.previous_matches.all().order_by('id'))
                            if len(prev_matches) > 0 and prev_matches[0].match.id == match.id:
                                next_match.team1 = winner
                            elif len(prev_matches) > 1 and prev_matches[1].match.id == match.id:
                                next_match.team2 = winner
                                
                        next_match.save()

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services import generate_knockout_stage

class GenerateKnockoutView(APIView):
    def post(self, request):
        try:
            matches = generate_knockout_stage()
            serializer = MatchSerializer(matches, many=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class SimulateKnockoutView(APIView):
    def post(self, request):
        try:
            from .services import simulate_knockout_stage
            simulate_knockout_stage()
            return Response({"status": "success"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)