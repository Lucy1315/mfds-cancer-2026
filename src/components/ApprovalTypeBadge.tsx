import { Pill, FlaskConical, Sparkles, Dna, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApprovalTypeBadgeProps {
  approvalType?: string;
  className?: string;
}

// 개별 배지 타입 정의
type BadgeType = 'newDrug' | 'generic' | 'orphan' | 'biotech' | 'dataSubmission' | 'default';

const badgeConfigs: Record<BadgeType, {
  icon: typeof Sparkles;
  bgColor: string;
  textColor: string;
  borderColor: string;
  label: string;
}> = {
  newDrug: {
    icon: Sparkles,
    bgColor: 'bg-blue-500/15',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-500/30',
    label: '신약',
  },
  generic: {
    icon: Pill,
    bgColor: 'bg-emerald-500/15',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-500/30',
    label: '제네릭',
  },
  orphan: {
    icon: FlaskConical,
    bgColor: 'bg-purple-500/15',
    textColor: 'text-purple-600 dark:text-purple-400',
    borderColor: 'border-purple-500/30',
    label: '희귀',
  },
  biotech: {
    icon: Dna,
    bgColor: 'bg-cyan-500/15',
    textColor: 'text-cyan-600 dark:text-cyan-400',
    borderColor: 'border-cyan-500/30',
    label: '유전자재조합 및 세포배양의약품',
  },
  dataSubmission: {
    icon: FileText,
    bgColor: 'bg-amber-500/15',
    textColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-500/30',
    label: '자료제출의약품',
  },
  default: {
    icon: FileText,
    bgColor: 'bg-muted',
    textColor: 'text-muted-foreground',
    borderColor: 'border-muted',
    label: '-',
  },
};

// 허가유형 문자열에서 개별 배지 타입 추출
const parseApprovalTypes = (approvalType: string): BadgeType[] => {
  const badges: BadgeType[] = [];
  
  if (approvalType.includes('신약')) {
    badges.push('newDrug');
  }
  if (approvalType.includes('제네릭')) {
    badges.push('generic');
  }
  if (approvalType.includes('희귀')) {
    badges.push('orphan');
  }
  if (approvalType.includes('유전자재조합') || approvalType.includes('세포배양')) {
    badges.push('biotech');
  }
  if (approvalType.includes('자료제출')) {
    badges.push('dataSubmission');
  }
  
  return badges.length > 0 ? badges : ['default'];
};

// 개별 배지 컴포넌트
const SingleBadge = ({ type }: { type: BadgeType }) => {
  const config = badgeConfigs[type];
  const IconComponent = config.icon;
  
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium whitespace-nowrap',
        config.bgColor,
        config.textColor,
        config.borderColor
      )}
    >
      <IconComponent className="w-3 h-3 flex-shrink-0" />
      <span>{config.label}</span>
    </div>
  );
};

const ApprovalTypeBadge = ({ approvalType, className }: ApprovalTypeBadgeProps) => {
  if (!approvalType || approvalType === '-') {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  const badgeTypes = parseApprovalTypes(approvalType);

  return (
    <div className={cn('flex flex-wrap gap-1', className)} title={approvalType}>
      {badgeTypes.map((type, idx) => (
        <SingleBadge key={idx} type={type} />
      ))}
    </div>
  );
};

export default ApprovalTypeBadge;
