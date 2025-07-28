import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Vote, Clock, User, CheckCircle, BarChart3, Users, Calendar } from "lucide-react";
import { Election, Candidate, Position, Club } from "@shared/schema";
import { ChatbotWidget } from "@/components/chatbot";

type ElectionWithVotes = Election & { 
  club: Club; 
  positions: Position[]; 
  userVotes?: Record<string, boolean>; 
};

type CandidateWithUser = Candidate & { 
  user: { firstName: string; lastName: string; email: string }; 
  position: Position; 
};

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [selectedElection, setSelectedElection] = useState<ElectionWithVotes | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<Record<string, string>>({});

  const { data: elections, isLoading } = useQuery<ElectionWithVotes[]>({
    queryKey: ["/api/elections/active"],
  });

  const { data: candidates } = useQuery<CandidateWithUser[]>({
    queryKey: ["/api/elections", selectedElection?.id, "candidates"],
    enabled: !!selectedElection,
  });

  const voteMutation = useMutation({
    mutationFn: async (voteData: { candidateId: string; electionId: string; positionId: string }) => {
      const res = await apiRequest("POST", "/api/vote", voteData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Vote submitted successfully!",
        description: "Your vote has been recorded securely.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/elections/active"] });
      setSelectedElection(null);
      setSelectedCandidates({});
    },
    onError: (error) => {
      toast({
        title: "Vote submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVoteSubmission = () => {
    if (!selectedElection || !candidates) return;

    const positions = candidates.reduce((acc, candidate) => {
      if (!acc.includes(candidate.position.id)) {
        acc.push(candidate.position.id);
      }
      return acc;
    }, []);

    const votes = positions.map(positionId => ({
      candidateId: selectedCandidates[positionId],
      electionId: selectedElection.id,
      positionId,
    })).filter(vote => vote.candidateId);

    if (votes.length !== positions.length) {
      toast({
        title: "Incomplete voting",
        description: "Please select a candidate for each position.",
        variant: "destructive",
      });
      return;
    }

    votes.forEach(voteData => {
      voteMutation.mutate(voteData);
    });
  };

  const getElectionIcon = (clubName: string) => {
    const iconMap = {
      "Technical Club": "fas fa-code",
      "Cultural Club": "fas fa-theater-masks",
      "Sports Club": "fas fa-running",
      "Literary Club": "fas fa-book",
    };
    return iconMap[clubName] || "fas fa-users";
  };

  const getUserVotingStatus = (election: ElectionWithVotes) => {
    if (!election.userVotes) return "Not Voted";
    const totalPositions = election.positions.length;
    const votedPositions = Object.values(election.userVotes).filter(Boolean).length;
    
    if (votedPositions === totalPositions) return "Completed";
    if (votedPositions > 0) return "Partial";
    return "Not Voted";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "text-green-600";
      case "Partial": return "text-yellow-600";
      default: return "text-orange-600";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Vote className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-neutral-900">VoteEd</h1>
                  <p className="text-xs text-neutral-600">Student Election System</p>
                </div>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#dashboard" className="text-primary font-medium">Dashboard</a>
              <a href="#elections" className="text-neutral-600 hover:text-primary transition-colors">Elections</a>
              <a href="#results" className="text-neutral-600 hover:text-primary transition-colors">Results</a>
            </nav>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-neutral-700">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-neutral-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-neutral-600 capitalize">{user?.role}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                className="text-neutral-600 hover:text-neutral-900"
              >
                <i className="fas fa-sign-out-alt"></i>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold mb-2">
                Welcome back, {user?.firstName}!
              </h2>
              <p className="text-primary-light">
                Your voice matters. Make sure to cast your vote in active elections.
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
                <User className="text-white" size={32} />
              </div>
            </div>
          </div>
        </div>

        {/* Active Elections */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-neutral-900">Active Elections</h3>
            <div className="flex items-center space-x-2 text-sm text-neutral-600">
              <Clock size={16} />
              <span>Elections in progress</span>
            </div>
          </div>

          {elections?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No Active Elections</h3>
                <p className="text-neutral-600">There are currently no active elections. Check back later for upcoming elections.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {elections?.map((election) => {
                const votingStatus = getUserVotingStatus(election);
                const canVote = votingStatus !== "Completed";
                
                return (
                  <Card key={election.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                            <i className={`${getElectionIcon(election.club.name)} text-secondary text-lg`}></i>
                          </div>
                          <div>
                            <h4 className="font-semibold text-neutral-900">{election.club.name}</h4>
                            <p className="text-sm text-neutral-600">{election.positions.length} positions</p>
                          </div>
                        </div>
                        <Badge 
                          variant={votingStatus === "Completed" ? "default" : "secondary"}
                          className={votingStatus === "Completed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}
                        >
                          {votingStatus === "Completed" ? (
                            <>
                              <CheckCircle size={12} className="mr-1" />
                              Voted
                            </>
                          ) : (
                            "Active"
                          )}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">Positions:</span>
                          <span className="font-medium">
                            {election.positions.map(p => p.name).join(", ")}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">Status:</span>
                          <span className={`font-medium ${getStatusColor(votingStatus)}`}>
                            {votingStatus}
                          </span>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full" 
                        disabled={!canVote}
                        onClick={() => setSelectedElection(election)}
                      >
                        {canVote ? "Vote Now" : "Already Voted"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Voting Stats */}
        <section className="mt-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">
                      {elections?.filter(e => getUserVotingStatus(e) === "Completed").length || 0}
                    </p>
                    <p className="text-sm text-neutral-600">Votes Completed</p>
                  </div>
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="text-success" size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">
                      {elections?.filter(e => getUserVotingStatus(e) !== "Completed").length || 0}
                    </p>
                    <p className="text-sm text-neutral-600">Pending Elections</p>
                  </div>
                  <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                    <Clock className="text-warning" size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">
                      {elections?.length ? Math.round((elections.filter(e => getUserVotingStatus(e) === "Completed").length / elections.length) * 100) : 0}%
                    </p>
                    <p className="text-sm text-neutral-600">Participation Rate</p>
                  </div>
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <BarChart3 className="text-primary" size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Voting Modal */}
      <Dialog open={!!selectedElection} onOpenChange={() => setSelectedElection(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedElection?.club.name} Elections
            </DialogTitle>
            <p className="text-sm text-neutral-600">Cast your vote for each position</p>
          </DialogHeader>

          <div className="space-y-8">
            {candidates && 
              [...new Set(candidates.map(c => c.position.id))].map(positionId => {
                const position = candidates.find(c => c.position.id === positionId)?.position;
                const positionCandidates = candidates.filter(c => c.position.id === positionId);

                return (
                  <div key={positionId}>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                      {position?.name}
                    </h3>
                    <RadioGroup
                      value={selectedCandidates[positionId]}
                      onValueChange={(value) => 
                        setSelectedCandidates(prev => ({ ...prev, [positionId]: value }))
                      }
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        {positionCandidates.map((candidate) => (
                          <div key={candidate.id} className="border border-neutral-200 rounded-lg p-4">
                            <div className="flex items-start space-x-4">
                              <RadioGroupItem value={candidate.id} id={candidate.id} className="mt-1" />
                              <div className="flex-1">
                                <Label htmlFor={candidate.id} className="cursor-pointer">
                                  <h4 className="font-semibold text-neutral-900">
                                    {candidate.user.firstName} {candidate.user.lastName}
                                  </h4>
                                  <p className="text-sm text-neutral-600">{candidate.user.email}</p>
                                  {candidate.manifesto && (
                                    <p className="text-sm text-neutral-700 mt-2">
                                      {candidate.manifesto}
                                    </p>
                                  )}
                                </Label>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                );
              })
            }
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-neutral-200">
            <div className="text-sm text-neutral-600 flex items-center">
              <i className="fas fa-shield-alt text-success mr-1"></i>
              Your vote is secure and anonymous
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setSelectedElection(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleVoteSubmission}
                disabled={voteMutation.isPending}
              >
                {voteMutation.isPending ? "Submitting..." : "Submit Votes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chatbot Widget */}
      <ChatbotWidget />
    </div>
  );
}
