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
            # Atualiza os pontos e gols
            update_group_standings(match.group.id)
            # Reordena as posições (sua função já existente!)
            calculate_group_positions()