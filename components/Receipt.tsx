import type { CdMetric } from "@/src/lib/types";
import { receiptLines } from "@/src/lib/civicCosts";
import { fmtUsd } from "@/src/lib/format";
import { BOROUGH_BY_DIGIT } from "@/src/lib/pipeline/cdId";

/**
 * "The City's Receipt" — translates a district's ghost-dollar gap into
 * tangible civic goods at published NYC unit costs. Purely illustrative:
 * these dollars are NOT earmarked. We show scale, not a promise.
 */
export function Receipt({ cd }: { cd: CdMetric }) {
  if (cd.ghostDollars <= 0) return null;
  const lines = receiptLines(cd.ghostDollars);
  if (lines.length === 0) return null;

  const borough = BOROUGH_BY_DIGIT[cd.boroCd[0]] ?? "NYC";
  const num = parseInt(cd.boroCd.slice(1), 10);
  const districtName = `${borough} CD${num}`;

  return (
    <div className="receipt" aria-label="Illustrative civic receipt">
      <div className="receipt-paper">
        <div className="receipt-header">
          <div className="receipt-city">CITY OF NEW YORK · UNOFFICIAL</div>
          <div className="receipt-district">{districtName}</div>
          <div className="receipt-total">{fmtUsd(cd.ghostDollars)} gap</div>
        </div>

        <div className="receipt-rule" aria-hidden="true">
          --------------------------------
        </div>

        <p className="receipt-framing">
          If that gap were spent here,
          <br />
          at city unit costs, it could fund:
        </p>

        <div className="receipt-rule" aria-hidden="true">
          --------------------------------
        </div>

        <ul className="receipt-lines">
          {lines.map((line) => (
            <li key={line.label} className="receipt-line">
              <span className="receipt-label">{line.label}</span>
              <span className="receipt-dots" aria-hidden="true" />
              <span className="receipt-qty">{line.qty.toLocaleString()}</span>
            </li>
          ))}
        </ul>

        <div className="receipt-rule" aria-hidden="true">
          ================================
        </div>

        <div className="receipt-footer">*** thank you, come again ***</div>

        <div className="receipt-sources">
          Illustrative only — not earmarked funds.
          <br />
          Sources: NYC SCA FY25-29 · DOT May 2025 ·
          <br />
          NYCHA PNA 2023 · NYC Parks Capital Tracker
        </div>

        <div className="receipt-tear" aria-hidden="true" />
      </div>
    </div>
  );
}
