import { LogOut, Mail, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmailTab from '@/components/EmailTab';
import { ExtendedDrugApproval } from '@/data/recentApprovals';
import { FilterState } from '@/components/FilterPanel';

interface AdminPanelProps {
  data: ExtendedDrugApproval[];
  filters: FilterState;
  onLogout: () => void;
}

const AdminPanel = ({ data, filters, onLogout }: AdminPanelProps) => {
  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    onLogout();
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold text-foreground">관리자 모드</h2>
            <p className="text-sm text-muted-foreground">
              이메일 발송 및 관리 기능
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleLogout} className="gap-2">
          <LogOut className="w-4 h-4" />
          로그아웃
        </Button>
      </div>

      {/* 관리자 탭 */}
      <Tabs defaultValue="email" className="w-full">
        <TabsList>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="w-4 h-4" />
            이메일
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-6">
          <EmailTab data={data} filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
