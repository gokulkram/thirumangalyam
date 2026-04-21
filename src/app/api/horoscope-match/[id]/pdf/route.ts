import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { Profile } from "@/lib/db/models";
import { computePoruthams, doshamResult } from "@/lib/horoscope";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * GET /api/horoscope-match/[id]/pdf
 * Returns a downloadable HTML document styled for PDF printing.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const [myProfile, otherProfile] = await Promise.all([
      Profile.findOne({ userId: session.user.id })
        .select("fullName star rashi hasDosham community dateOfBirth")
        .lean(),
      Profile.findOne({ userId: id })
        .select("fullName star rashi hasDosham community dateOfBirth")
        .lean(),
    ]);

    if (!myProfile || !otherProfile) {
      return new NextResponse("Profile not found", { status: 404 });
    }

    const mp = myProfile as any;
    const op = otherProfile as any;

    const { poruthams, matchedCount, totalCount } = computePoruthams(
      mp.star || "",
      op.star || "",
      mp.rashi || "",
      op.rashi || ""
    );

    const score = totalCount === 0 ? 0 : Math.round((matchedCount / totalCount) * 100);
    let label = "Poor Match";
    if (score >= 80) label = "Excellent Match";
    else if (score >= 60) label = "Good Match";
    else if (score >= 40) label = "Average Match";

    const dosham = doshamResult(mp.hasDosham, op.hasDosham);
    const generatedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    const poruthamsHtml = poruthams
      .map(
        (p) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;">
            <strong>${escapeHtml(p.name)}</strong><br/>
            <span style="color:#888;font-size:12px;">${escapeHtml(p.tamilName)}</span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;text-align:center;">
            ${
              p.isCompatible === true
                ? '<span style="color:#16a34a;font-weight:600;">&#10003; Compatible</span>'
                : p.isCompatible === false
                ? '<span style="color:#dc2626;font-weight:600;">&#10007; Not Compatible</span>'
                : '<span style="color:#d97706;font-weight:600;">&#9888; Partial</span>'
            }
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;color:#555;font-size:13px;">
            ${escapeHtml(p.description)}
          </td>
        </tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Horoscope Match Report — Thirumangalyam</title>
  <style>
    @page { margin: 20mm; size: A4; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; line-height: 1.5; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 3px solid #D64545; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #D64545; font-size: 28px; margin-bottom: 4px; }
    .header p { color: #666; font-size: 13px; }
    .profiles { display: flex; justify-content: center; align-items: center; gap: 40px; margin: 30px 0; }
    .profile-box { text-align: center; flex: 1; padding: 20px; border: 1px solid #e5e5e5; border-radius: 10px; }
    .profile-box h3 { font-size: 18px; margin-bottom: 8px; }
    .profile-box .detail { color: #555; font-size: 13px; margin: 2px 0; }
    .score-box { text-align: center; padding: 20px 30px; background: linear-gradient(135deg, #FFF5F5, #FFF0E0); border-radius: 12px; margin: 24px auto; max-width: 300px; }
    .score-box .score { font-size: 48px; font-weight: 800; color: #D64545; }
    .score-box .label { font-size: 16px; font-weight: 600; color: #333; margin-top: 4px; }
    .score-box .sub { font-size: 13px; color: #666; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    table th { background: #f9fafb; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; border-bottom: 2px solid #e5e5e5; }
    .section-title { font-size: 18px; font-weight: 700; color: #333; margin: 30px 0 12px; }
    .dosham-box { padding: 16px; border: 1px solid #e5e5e5; border-radius: 8px; background: #fafafa; margin: 16px 0; }
    .footer { text-align: center; margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e5e5; color: #999; font-size: 11px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:center;margin-bottom:20px;">
    <button onclick="window.print()" style="padding:10px 24px;background:#D64545;color:white;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;">
      Download as PDF
    </button>
    <p style="color:#888;font-size:12px;margin-top:6px;">Click the button above, then choose "Save as PDF" in the print dialog.</p>
  </div>

  <div class="header">
    <h1>Thirumangalyam</h1>
    <p>Horoscope Compatibility Report</p>
  </div>

  <div class="profiles">
    <div class="profile-box">
      <h3>${escapeHtml(mp.fullName || "—")}</h3>
      <p class="detail">Star: <strong>${escapeHtml(mp.star || "—")}</strong></p>
      <p class="detail">Rashi: <strong>${escapeHtml(mp.rashi || "—")}</strong></p>
      <p class="detail">Dosham: <strong>${mp.hasDosham === true ? "Yes" : mp.hasDosham === false ? "No" : "Unknown"}</strong></p>
      ${mp.community ? `<p class="detail">Community: ${escapeHtml(mp.community)}</p>` : ""}
    </div>
    <div style="font-size:24px;color:#D64545;font-weight:bold;">VS</div>
    <div class="profile-box">
      <h3>${escapeHtml(op.fullName || "—")}</h3>
      <p class="detail">Star: <strong>${escapeHtml(op.star || "—")}</strong></p>
      <p class="detail">Rashi: <strong>${escapeHtml(op.rashi || "—")}</strong></p>
      <p class="detail">Dosham: <strong>${op.hasDosham === true ? "Yes" : op.hasDosham === false ? "No" : "Unknown"}</strong></p>
      ${op.community ? `<p class="detail">Community: ${escapeHtml(op.community)}</p>` : ""}
    </div>
  </div>

  <div class="score-box">
    <div class="score">${score}%</div>
    <div class="label">${label}</div>
    <div class="sub">${matchedCount} of ${totalCount} poruthams matched</div>
  </div>

  <h2 class="section-title">Porutham Analysis (10 Poruthams)</h2>
  <table>
    <thead>
      <tr>
        <th style="width:30%;">Porutham</th>
        <th style="width:25%;text-align:center;">Result</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      ${poruthamsHtml}
    </tbody>
  </table>

  <h2 class="section-title">Dosham Compatibility</h2>
  <div class="dosham-box">
    <p><strong>${escapeHtml(mp.fullName?.split(" ")[0] || "Profile A")}:</strong> ${mp.hasDosham === true ? "Has Dosham" : mp.hasDosham === false ? "No Dosham" : "Unknown"}</p>
    <p><strong>${escapeHtml(op.fullName?.split(" ")[0] || "Profile B")}:</strong> ${op.hasDosham === true ? "Has Dosham" : op.hasDosham === false ? "No Dosham" : "Unknown"}</p>
    <p style="margin-top:8px;color:#555;"><em>${dosham}</em></p>
  </div>

  <div class="footer">
    <p>Generated on ${generatedAt} by Thirumangalyam</p>
    <p>This is a computer-generated report based on traditional Tamil astrology rules.</p>
    <p>For detailed analysis, please consult a qualified astrologer.</p>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="horoscope-match-report.html"`,
      },
    });
  } catch (error: any) {
    console.error("GET /api/horoscope-match/[id]/pdf error:", error);
    return new NextResponse("Failed to generate report", { status: 500 });
  }
}
