"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import { Download } from "lucide-react";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  coverPage: {
    padding: 40,
    fontFamily: "Helvetica",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  title: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    textAlign: "center",
  },
  overallScore: {
    fontSize: 48,
    fontFamily: "Helvetica-Bold",
    marginTop: 24,
    textAlign: "center",
  },
  scoreLabel: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 12,
    marginTop: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#1e40af",
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5e5",
  },
  headerRow: {
    flexDirection: "row",
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    fontFamily: "Helvetica-Bold",
  },
  col: {
    paddingHorizontal: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#fff",
  },
  statBox: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 4,
    width: "23%",
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  text: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  smallText: {
    fontSize: 8,
    color: "#666",
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f5f5f5",
    padding: 8,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 3,
  },
  itemRow: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingLeft: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#999",
  },
});

const riskBadgeColor = (rating: string) => {
  switch (rating) {
    case "critical": return "#991b1b";
    case "high": return "#dc2626";
    case "medium": return "#ca8a04";
    case "low": return "#16a34a";
    default: return "#3b82f6";
  }
};

const scoreBgColor = (score: number | null) => {
  if (!score) return "#e5e5e5";
  if (score >= 4) return "#22c55e";
  if (score >= 3) return "#eab308";
  if (score >= 2) return "#f97316";
  return "#ef4444";
};

type Props = {
  survey: {
    clientName: string;
    clientType: string;
    address: string | null;
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    status: string;
    overallScore: number | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
  };
  categoryScores: {
    name: string;
    weight: number;
    average: number | null;
    totalItems: number;
    answeredItems: number;
    items: {
      text: string;
      score: number | null;
      notes: string | null;
      na: boolean;
    }[];
  }[];
  riskEntries: {
    id: string;
    threatName: string;
    threatDescription: string | null;
    threat: number;
    vulnerability: number;
    impact: number;
    riskScore: number;
    riskRating: string;
    mitigation: string | null;
  }[];
  photos: {
    id: string;
    filepath: string;
    caption: string | null;
    annotations: { id: string; type: string; label: string | null }[];
  }[];
};

function SurveyPDFDocument({ survey, categoryScores, riskEntries }: Props) {
  const dateStr = new Date(survey.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      {/* Cover Page */}
      <Page size="LETTER" style={styles.coverPage}>
        <Text style={{ fontSize: 12, color: "#1e40af", marginBottom: 40, fontFamily: "Helvetica-Bold" }}>
          A.S.S. — AUTOMATED SITE SURVEYOR
        </Text>
        <Text style={{ fontSize: 12, color: "#666", letterSpacing: 3, marginBottom: 8 }}>
          PHYSICAL SECURITY ASSESSMENT
        </Text>
        <Text style={styles.title}>{survey.clientName}</Text>
        <Text style={styles.subtitle}>
          {survey.clientType.charAt(0).toUpperCase() + survey.clientType.slice(1)}
        </Text>
        {survey.address && <Text style={styles.subtitle}>{survey.address}</Text>}
        <Text style={{ ...styles.subtitle, marginTop: 16 }}>{dateStr}</Text>
        {survey.overallScore !== null && (
          <View style={{ marginTop: 40 }}>
            <Text style={{ ...styles.overallScore, color: scoreBgColor(survey.overallScore) }}>
              {survey.overallScore.toFixed(1)}
            </Text>
            <Text style={styles.scoreLabel}>Overall Security Score (out of 5.0)</Text>
          </View>
        )}
        <Text style={styles.footer as never}>CONFIDENTIAL</Text>
      </Page>

      {/* Executive Summary */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <View style={styles.statsRow}>
          {[
            { label: "Categories", value: `${categoryScores.filter(c => c.answeredItems > 0).length}/${categoryScores.length}` },
            { label: "Risks Identified", value: riskEntries.length.toString() },
            { label: "Overall Score", value: survey.overallScore?.toFixed(1) ?? "N/A" },
            { label: "Status", value: survey.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) },
          ].map((stat) => (
            <View key={stat.label} style={styles.statBox}>
              <Text style={{ fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 }}>{stat.value}</Text>
              <Text style={styles.smallText}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {survey.contactName && (
          <View style={{ marginBottom: 8 }}>
            <Text style={styles.text}>Contact: {survey.contactName}</Text>
            {survey.contactEmail && <Text style={styles.smallText}>{survey.contactEmail}</Text>}
            {survey.contactPhone && <Text style={styles.smallText}>{survey.contactPhone}</Text>}
          </View>
        )}

        {survey.notes && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 4 }}>Notes</Text>
            <Text style={styles.text}>{survey.notes}</Text>
          </View>
        )}

        {/* Category Score Summary Table */}
        <Text style={styles.sectionTitle}>Category Scores</Text>
        <View style={styles.headerRow}>
          <Text style={{ ...styles.col, width: "50%" }}>Category</Text>
          <Text style={{ ...styles.col, width: "15%", textAlign: "center" }}>Score</Text>
          <Text style={{ ...styles.col, width: "15%", textAlign: "center" }}>Items</Text>
          <Text style={{ ...styles.col, width: "20%", textAlign: "center" }}>Weight</Text>
        </View>
        {categoryScores.map((cat) => (
          <View key={cat.name} style={styles.row}>
            <Text style={{ ...styles.col, width: "50%" }}>{cat.name}</Text>
            <Text style={{ ...styles.col, width: "15%", textAlign: "center", fontFamily: "Helvetica-Bold" }}>
              {cat.average !== null ? cat.average.toFixed(1) : "—"}
            </Text>
            <Text style={{ ...styles.col, width: "15%", textAlign: "center" }}>
              {cat.answeredItems}/{cat.totalItems}
            </Text>
            <Text style={{ ...styles.col, width: "20%", textAlign: "center" }}>
              {cat.weight}x
            </Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text>A.S.S. — Automated Site Surveyor</Text>
          <Text>CONFIDENTIAL</Text>
        </View>
      </Page>

      {/* Detailed Findings */}
      <Page size="LETTER" style={styles.page} wrap>
        <Text style={styles.sectionTitle}>Detailed Findings</Text>
        {categoryScores.map((cat) => (
          <View key={cat.name} wrap={false}>
            <View style={styles.categoryHeader}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>{cat.name}</Text>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>
                {cat.average !== null ? cat.average.toFixed(1) : "N/A"}
              </Text>
            </View>
            {cat.items
              .filter((i) => i.score !== null || i.na)
              .map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <View style={{
                    width: 20,
                    height: 14,
                    borderRadius: 2,
                    backgroundColor: item.na ? "#9ca3af" : scoreBgColor(item.score),
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 8,
                  }}>
                    <Text style={{ color: "#fff", fontSize: 8, fontFamily: "Helvetica-Bold" }}>
                      {item.na ? "N/A" : item.score}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.text}>{item.text}</Text>
                    {item.notes && (
                      <Text style={{ ...styles.smallText, marginTop: 2 }}>Note: {item.notes}</Text>
                    )}
                  </View>
                </View>
              ))}
          </View>
        ))}

        <View style={styles.footer}>
          <Text>A.S.S. — Automated Site Surveyor</Text>
          <Text>CONFIDENTIAL</Text>
        </View>
      </Page>

      {/* Risk Assessment */}
      {riskEntries.length > 0 && (
        <Page size="LETTER" style={styles.page} wrap>
          <Text style={styles.sectionTitle}>Risk Assessment</Text>

          <View style={styles.headerRow}>
            <Text style={{ ...styles.col, width: "8%" }}>Score</Text>
            <Text style={{ ...styles.col, width: "12%" }}>Rating</Text>
            <Text style={{ ...styles.col, width: "25%" }}>Threat</Text>
            <Text style={{ ...styles.col, width: "10%", textAlign: "center" }}>T×V×I</Text>
            <Text style={{ ...styles.col, width: "45%" }}>Mitigation</Text>
          </View>

          {riskEntries.map((entry) => (
            <View key={entry.id} style={styles.row} wrap={false}>
              <Text style={{ ...styles.col, width: "8%", fontFamily: "Helvetica-Bold" }}>
                {entry.riskScore}
              </Text>
              <View style={{ ...styles.col, width: "12%" }}>
                <View style={{
                  ...styles.badge,
                  backgroundColor: riskBadgeColor(entry.riskRating),
                  alignSelf: "flex-start",
                }}>
                  <Text style={{ color: "#fff", fontSize: 7 }}>
                    {entry.riskRating.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={{ ...styles.col, width: "25%" }}>
                <Text style={styles.text}>{entry.threatName}</Text>
                {entry.threatDescription && (
                  <Text style={styles.smallText}>{entry.threatDescription}</Text>
                )}
              </View>
              <Text style={{ ...styles.col, width: "10%", textAlign: "center" }}>
                {entry.threat}×{entry.vulnerability}×{entry.impact}
              </Text>
              <Text style={{ ...styles.col, width: "45%", fontSize: 9 }}>
                {entry.mitigation || "—"}
              </Text>
            </View>
          ))}

          <View style={styles.footer}>
            <Text>A.S.S. — Automated Site Surveyor</Text>
            <Text>CONFIDENTIAL</Text>
          </View>
        </Page>
      )}

      {/* Recommendations Page */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.sectionTitle}>Key Recommendations</Text>

        {/* Items scored 1-2 */}
        {categoryScores.flatMap((cat) =>
          cat.items
            .filter((i) => i.score !== null && i.score <= 2)
            .map((item) => ({ ...item, category: cat.name }))
        ).length > 0 ? (
          <>
            <Text style={{ ...styles.text, marginBottom: 8, fontFamily: "Helvetica-Bold" }}>
              Priority Areas (scored 1-2):
            </Text>
            {categoryScores.flatMap((cat) =>
              cat.items
                .filter((i) => i.score !== null && i.score <= 2)
                .map((item, idx) => (
                  <View key={`${cat.name}-${idx}`} style={{ ...styles.row, paddingLeft: 8 }}>
                    <View style={{
                      width: 20,
                      height: 14,
                      borderRadius: 2,
                      backgroundColor: scoreBgColor(item.score),
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 8,
                    }}>
                      <Text style={{ color: "#fff", fontSize: 8, fontFamily: "Helvetica-Bold" }}>
                        {item.score}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.smallText}>{cat.name}</Text>
                      <Text style={styles.text}>{item.text}</Text>
                      {item.notes && (
                        <Text style={{ ...styles.smallText, marginTop: 2 }}>{item.notes}</Text>
                      )}
                    </View>
                  </View>
                ))
            )}
          </>
        ) : (
          <Text style={styles.text}>No critical findings (score 1-2) identified.</Text>
        )}

        {/* High-risk entries */}
        {riskEntries.filter((e) => e.riskScore >= 50).length > 0 && (
          <>
            <Text style={{ ...styles.text, marginTop: 16, marginBottom: 8, fontFamily: "Helvetica-Bold" }}>
              High/Critical Risk Mitigations:
            </Text>
            {riskEntries
              .filter((e) => e.riskScore >= 50)
              .map((entry) => (
                <View key={entry.id} style={{ ...styles.row, paddingLeft: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...styles.text, fontFamily: "Helvetica-Bold" }}>
                      {entry.threatName} (Score: {entry.riskScore})
                    </Text>
                    <Text style={styles.text}>{entry.mitigation || "No mitigation specified"}</Text>
                  </View>
                </View>
              ))}
          </>
        )}

        <View style={styles.footer}>
          <Text>A.S.S. — Automated Site Surveyor</Text>
          <Text>CONFIDENTIAL</Text>
        </View>
      </Page>
    </Document>
  );
}

export function PDFDownloadButton(props: Props) {
  const filename = `${props.survey.clientName.replace(/[^a-zA-Z0-9]/g, "_")}_Security_Assessment.pdf`;

  return (
    <PDFDownloadLink
      document={<SurveyPDFDocument {...props} />}
      fileName={filename}
      className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
    >
      {({ loading }) => (
        <>
          <Download className="w-4 h-4" />
          {loading ? "Generating..." : "Download PDF"}
        </>
      )}
    </PDFDownloadLink>
  );
}
