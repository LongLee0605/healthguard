import {
  LayoutDashboard,
  MessageCircle,
  HeartPulse,
  FileText,
  Bot,
  Pill,
  Bell,
  FileBarChart,
  History,
  User,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  hint: string;
  group: string;
  Icon: LucideIcon;
}

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Theo dõi',
    items: [
      { href: '/dashboard', label: 'Tổng quan', hint: 'điểm sức khỏe trang chủ', group: 'Theo dõi', Icon: LayoutDashboard },
      { href: '/dashboard/vitals', label: 'Chỉ số', hint: 'huyết áp đường huyết cân nặng', group: 'Theo dõi', Icon: HeartPulse },
      { href: '/dashboard/symptoms', label: 'Triệu chứng', hint: 'ghi nhận mức độ', group: 'Theo dõi', Icon: FileText },
      { href: '/dashboard/medications', label: 'Thuốc', hint: 'lịch uống nhắc liều', group: 'Theo dõi', Icon: Pill },
      { href: '/dashboard/timeline', label: 'Nhật ký', hint: 'dòng thời gian', group: 'Theo dõi', Icon: History },
    ],
  },
  {
    label: 'Trợ lý AI',
    items: [
      { href: '/dashboard/chat', label: 'AI Chat', hint: 'hỏi đáp sức khỏe', group: 'Trợ lý AI', Icon: MessageCircle },
      { href: '/dashboard/ai', label: 'Phân tích AI', hint: 'triệu chứng chuyên khoa', group: 'Trợ lý AI', Icon: Bot },
    ],
  },
  {
    label: 'Tài khoản',
    items: [
      { href: '/dashboard/alerts', label: 'Cảnh báo', hint: 'thông báo bất thường', group: 'Tài khoản', Icon: Bell },
      { href: '/dashboard/reports', label: 'Báo cáo', hint: 'in pdf xuất file', group: 'Tài khoản', Icon: FileBarChart },
      { href: '/dashboard/profile', label: 'Hồ sơ', hint: 'thông tin cá nhân xuất dữ liệu', group: 'Tài khoản', Icon: User },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);
