from django.urls import path
from .views import GroupListView, TeamListView, MatchListView, MatchUpdateView

urlpatterns = [
    path('groups/', GroupListView.as_view(), name='group-list'),
    path('teams/', TeamListView.as_view(), name='team-list'),
    path('matches/', MatchListView.as_view(), name='match-list'),
    # Nova rota para atualizar a partida
    path('matches/<int:pk>/', MatchUpdateView.as_view(), name='match-update'),
]