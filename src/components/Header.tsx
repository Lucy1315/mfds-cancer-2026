import { Pill } from 'lucide-react';
 
 const Header = () => {
   return (
     <header className="gradient-header text-primary-foreground">
       <div className="container py-6">
        <div className="flex items-center">
           <div className="flex items-center gap-3">
             <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-foreground/15 backdrop-blur-sm">
               <Pill className="w-6 h-6" />
             </div>
             <div>
               <h1 className="text-2xl font-bold tracking-tight">MFDS 항암제 승인현황</h1>
               <p className="text-primary-foreground/80 text-sm mt-0.5">
                 식품의약품안전처 항암제 허가 데이터 대시보드
               </p>
             </div>
           </div>
         </div>
       </div>
     </header>
   );
 };
 
 export default Header;
