import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Vote, Users, Clock, Bus, Download, Plus, Eye, Edit, Trash } from "lucide-react";
import { ChatbotWidget } from "@/components/chatbot";

type AdminStats = {
  totalVotes: number;
  totalUsers: number;
  activeElections: number;
  totalCandidates: number;
};

type ElectionWithClub = {
  id: string;
  title: string;
  endDate: string;
  club: {
    name: string;
    icon?: string;
  };
  positions?: Array<{ id: string; name: string }>;
};

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();

  // Redirect non-admin users
  if (user && user.role !== "admin") {
    return <Redirect to="/" />;
  }

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: elections, isLoading: electionsLoading } = useQuery<ElectionWithClub[]>({
    queryKey: ["/api/elections/active"],
  });

  if (statsLoading || electionsLoading) {
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
                  <h1 className="text-xl font-semibold text-neutral-900">VoteEd Admin</h1>
                  <p className="text-xs text-neutral-600">Election Administration</p>
                </div>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#dashboard" className="text-primary font-medium">Dashboard</a>
              <a href="#elections" className="text-neutral-600 hover:text-primary transition-colors">Elections</a>
              <a href="#candidates" className="text-neutral-600 hover:text-primary transition-colors">Candidates</a>
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
        {/* Admin Header */}
        <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 rounded-xl p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Election Administration</h2>
              <p className="text-neutral-300">Manage elections, candidates, and monitor voting progress</p>
            </div>
            <div className="flex space-x-4">
              <Button className="bg-primary hover:bg-primary-dark">
                <Plus size={16} className="mr-2" />
                New Election
              </Button>
              <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                <Download size={16} className="mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </div>

        {/* Admin Stats */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-neutral-900">
                    {stats?.totalVotes || 0}
                  </p>
                  <p className="text-sm text-neutral-600">Total Votes Cast</p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <Vote className="text-success" size={20} />
                </div>
              </div>
              <div className="mt-2 text-xs text-success">
                <i className="fas fa-arrow-up mr-1"></i>
                Active voting in progress
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-neutral-900">
                    {stats?.totalUsers || 0}
                  </p>
                  <p className="text-sm text-neutral-600">Registered Users</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="text-primary" size={20} />
                </div>
              </div>
              <div className="mt-2 text-xs text-neutral-600">
                Eligible voters
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-neutral-900">
                    {stats?.activeElections || 0}
                  </p>
                  <p className="text-sm text-neutral-600">Active Elections</p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Clock className="text-warning" size={20} />
                </div>
              </div>
              <div className="mt-2 text-xs text-warning">
                Elections in progress
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-neutral-900">
                    {stats?.totalCandidates || 0}
                  </p>
                  <p className="text-sm text-neutral-600">Total Candidates</p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Bus className="text-accent" size={20} />
                </div>
              </div>
              <div className="mt-2 text-xs text-neutral-600">
                Across all positions
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Elections Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Election Management</CardTitle>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search elections..." 
                    className="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400"></i>
                </div>
                <Button variant="outline">
                  <i className="fas fa-filter mr-2"></i>Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="text-left py-3 px-6 text-xs font-medium text-neutral-600 uppercase tracking-wider">
                      Club/Position
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-neutral-600 uppercase tracking-wider">
                      Positions
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-neutral-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-neutral-600 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-neutral-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {elections?.map((election) => (
                    <tr key={election.id} className="hover:bg-neutral-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                            <i className={`${election.club.icon || 'fas fa-users'} text-secondary text-sm`}></i>
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">{election.club.name}</p>
                            <p className="text-sm text-neutral-600">{election.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-neutral-900">
                        {election.positions?.length || 0}
                      </td>
                      <td className="py-4 px-6">
                        <Badge className="bg-success/10 text-success">
                          Active
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-sm text-neutral-900">
                        {new Date(election.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" className="p-1">
                            <Eye size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" className="p-1">
                            <Edit size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" className="p-1 text-red-600 hover:text-red-700">
                            <Trash size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Chatbot Widget */}
      <ChatbotWidget />
    </div>
  );
}
