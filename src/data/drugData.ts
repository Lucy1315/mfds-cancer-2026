export interface DrugApproval {
  id: string;
  drugName: string;
  genericName: string;
  company: string;
  indication: string;
  cancerType: string;
  approvalDate: string;
  status: 'approved' | 'pending' | 'rejected';
  approvalNumber?: string;
  className?: string;
}

export const drugApprovals: DrugApproval[] = [
  {
    id: '1',
    drugName: '키트루다',
    genericName: 'Pembrolizumab',
    company: '한국MSD',
    indication: '비소세포폐암, 흑색종, 두경부암',
    cancerType: '폐암',
    approvalDate: '2024-12-15',
    status: 'approved',
    approvalNumber: 'MFDS-2024-0892'
  },
  {
    id: '2',
    drugName: '옵디보',
    genericName: 'Nivolumab',
    company: '한국BMS',
    indication: '비소세포폐암, 신세포암',
    cancerType: '폐암',
    approvalDate: '2024-11-20',
    status: 'approved',
    approvalNumber: 'MFDS-2024-0756'
  },
  {
    id: '3',
    drugName: '타그리소',
    genericName: 'Osimertinib',
    company: '한국아스트라제네카',
    indication: 'EGFR 변이 비소세포폐암',
    cancerType: '폐암',
    approvalDate: '2024-10-08',
    status: 'approved',
    approvalNumber: 'MFDS-2024-0634'
  },
  {
    id: '4',
    drugName: '허쥬마',
    genericName: 'Trastuzumab',
    company: '셀트리온',
    indication: 'HER2 양성 유방암',
    cancerType: '유방암',
    approvalDate: '2024-09-25',
    status: 'approved',
    approvalNumber: 'MFDS-2024-0521'
  },
  {
    id: '5',
    drugName: '이브란스',
    genericName: 'Palbociclib',
    company: '한국화이자',
    indication: 'HR+/HER2- 유방암',
    cancerType: '유방암',
    approvalDate: '2024-08-12',
    status: 'approved',
    approvalNumber: 'MFDS-2024-0445'
  },
  {
    id: '6',
    drugName: '렌비마',
    genericName: 'Lenvatinib',
    company: '한국에자이',
    indication: '간세포암, 갑상선암',
    cancerType: '간암',
    approvalDate: '2024-07-30',
    status: 'approved',
    approvalNumber: 'MFDS-2024-0398'
  },
  {
    id: '7',
    drugName: '린파자',
    genericName: 'Olaparib',
    company: '한국아스트라제네카',
    indication: 'BRCA 변이 난소암',
    cancerType: '난소암',
    approvalDate: '2024-06-18',
    status: 'approved',
    approvalNumber: 'MFDS-2024-0312'
  },
  {
    id: '8',
    drugName: '다라잘렉스',
    genericName: 'Daratumumab',
    company: '한국얀센',
    indication: '다발골수종',
    cancerType: '혈액암',
    approvalDate: '2024-05-22',
    status: 'approved',
    approvalNumber: 'MFDS-2024-0267'
  },
  {
    id: '9',
    drugName: '테센트릭',
    genericName: 'Atezolizumab',
    company: '한국로슈',
    indication: '소세포폐암, 요로상피암',
    cancerType: '폐암',
    approvalDate: '2024-04-10',
    status: 'approved',
    approvalNumber: 'MFDS-2024-0189'
  },
  {
    id: '10',
    drugName: '젤보라프',
    genericName: 'Vemurafenib',
    company: '한국로슈',
    indication: 'BRAF V600E 변이 흑색종',
    cancerType: '피부암',
    approvalDate: '2024-03-05',
    status: 'approved',
    approvalNumber: 'MFDS-2024-0098'
  },
  {
    id: '11',
    drugName: '임핀지',
    genericName: 'Durvalumab',
    company: '한국아스트라제네카',
    indication: '비소세포폐암 (병용요법)',
    cancerType: '폐암',
    approvalDate: '2025-01-15',
    status: 'pending',
    approvalNumber: 'MFDS-2025-0023'
  },
  {
    id: '12',
    drugName: '엔허투',
    genericName: 'Trastuzumab deruxtecan',
    company: '한국다이이찌산쿄',
    indication: 'HER2 양성 위암',
    cancerType: '위암',
    approvalDate: '2025-01-08',
    status: 'pending',
    approvalNumber: 'MFDS-2025-0015'
  },
];

export const cancerTypes = [
  '전체',
  '폐암',
  '유방암',
  '난소암',
  '전립선암',
  '다발성골수종',
  '급성골수성백혈병',
  '뇌종양(신경교종)',
  '간암',
  '위암',
  '대장암',
  '혈액암',
  '피부암',
];

export const yearlyStats = [
  { year: '2019', count: 8 },
  { year: '2020', count: 12 },
  { year: '2021', count: 15 },
  { year: '2022', count: 18 },
  { year: '2023', count: 22 },
  { year: '2024', count: 28 },
];
