import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.16";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface EmailRequest {
  recipients: string[];
  cc?: string[];
  subject: string;
  // 프론트엔드에서 렌더링한 HTML/텍스트 본문 (미리보기와 동일)
  htmlBody: string;
  textBody?: string;
  // 엑셀 첨부
  attachExcel: boolean;
  excelBase64?: string;
  excelFilename?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Gmail SMTP 환경변수 확인
    const GMAIL_USER = Deno.env.get("GMAIL_USER");
    const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      throw new Error(
        "GMAIL_USER 또는 GMAIL_APP_PASSWORD가 설정되지 않았습니다. Supabase secrets에 추가해 주세요."
      );
    }

    console.log(`[SMTP] Gmail 계정: ${GMAIL_USER}`);

    // Gmail SMTP 트랜스포트 (Port 587 STARTTLS)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 30000,
    });

    // SMTP 연결 검증
    console.log("[SMTP] 연결 검증 중...");
    await transporter.verify();
    console.log("[SMTP] Gmail SMTP 인증 성공");

    const {
      recipients,
      cc,
      subject,
      htmlBody,
      textBody,
      attachExcel,
      excelBase64,
      excelFilename,
    }: EmailRequest = await req.json();

    // 유효성 검사
    if (!recipients || recipients.length === 0) {
      throw new Error("수신자가 지정되지 않았습니다.");
    }
    if (!subject) {
      throw new Error("제목이 지정되지 않았습니다.");
    }
    if (!htmlBody) {
      throw new Error("이메일 본문(htmlBody)이 제공되지 않았습니다.");
    }

    // 첨부파일 준비
    const attachments = attachExcel && excelBase64 && excelFilename
      ? [{
          filename: excelFilename,
          content: excelBase64,
          encoding: "base64" as const,
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }]
      : [];

    console.log(`[SMTP] 발송: ${recipients.join(", ")}${cc && cc.length > 0 ? `, CC: ${cc.join(", ")}` : ""}, 첨부: ${attachments.length > 0 ? excelFilename : "없음"}`);

    // Gmail SMTP로 이메일 발송 — 프론트엔드 미리보기 HTML을 본문으로 직접 사용
    const info = await transporter.sendMail({
      from: `"MFDS 대시보드" <${GMAIL_USER}>`,
      to: recipients.join(", "),
      ...(cc && cc.length > 0 ? { cc: cc.join(", ") } : {}),
      subject: subject,
      text: textBody || "",
      html: htmlBody,
      attachments,
    });

    console.log(`[SMTP] 발송 완료 — messageId: ${info.messageId}, response: ${info.response}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `이메일이 ${recipients.length}명에게 발송되었습니다.`,
        messageId: info.messageId,
        smtpResponse: info.response,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    const errorMessage = error.message || "알 수 없는 오류";
    console.error("[SMTP] 오류:", errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
