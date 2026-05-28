import React, { useState } from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import AffiliateLink from '@site/src/components/AffiliateLink';

export default function BootcampCalculator(): React.ReactElement {
  const [bootcampCost, setBootcampCost] = useState(14000);
  const [durationMonths, setDurationMonths] = useState(6);
  const [loanInterest, setLoanInterest] = useState(5); // %

  const scrimbaMonthly = 30; // approx
  const scrimbaTotal = scrimbaMonthly * durationMonths;
  
  const loanTotal = bootcampCost * (1 + (loanInterest / 100));
  const savings = loanTotal - scrimbaTotal;
  const pageTitle = 'Bootcamp Cost Calculator';
  const pageTitleFull = `${pageTitle} | Scrimba Guide`;
  const pageDescription = 'Calculate how much you can save with Scrimba compared to a traditional coding bootcamp.';
  const canonicalUrl = 'https://scrimbaguide.tech/tools/bootcamp-cost-calculator';
  const socialImage = 'https://scrimbaguide.tech/img/social-card.png';

  return (
    <Layout title={pageTitle} description={pageDescription}>
      <Head>
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitleFull} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={socialImage} />
        <meta property="og:site_name" content="Scrimba Guide" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={pageTitleFull} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={socialImage} />
        <link rel="canonical" href={canonicalUrl} />
      </Head>
      <main>
      <div className="container margin-vert--lg tool-calculator">
        <h1>Bootcamp Cost Calculator</h1>
        <p>Compare the cost of a traditional coding bootcamp vs Scrimba Pro.</p>

        <div className="row">
          <div className="col col--6">
            <div className="card padding--lg">
              <h2>Bootcamp Assumptions</h2>
              <div className="margin-bottom--md">
                <label htmlFor="bootcamp-tuition" className="tool-calculator__input-label">Tuition Cost ($)</label>
                <input 
                  id="bootcamp-tuition"
                  type="number" 
                  value={bootcampCost} 
                  onChange={(e) => setBootcampCost(Number(e.target.value))}
                  className="tool-calculator__input"
                />
              </div>
              <div className="margin-bottom--md">
                <label htmlFor="bootcamp-duration" className="tool-calculator__input-label">Duration (Months)</label>
                <input 
                  id="bootcamp-duration"
                  type="number" 
                  value={durationMonths} 
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  className="tool-calculator__input"
                />
              </div>
              <div className="margin-bottom--md">
                <label htmlFor="bootcamp-interest" className="tool-calculator__input-label">Loan Interest Rate (%)</label>
                <input 
                  id="bootcamp-interest"
                  type="number" 
                  value={loanInterest} 
                  onChange={(e) => setLoanInterest(Number(e.target.value))}
                  className="tool-calculator__input"
                />
              </div>
            </div>
          </div>

          <div className="col col--6">
            <div className="card padding--lg tool-calculator__results">
              <h2>Your Savings</h2>
              <div className="margin-bottom--md">
                <p>Bootcamp Total (with interest): <strong>${loanTotal.toLocaleString()}</strong></p>
                <p>Scrimba Total: <strong>${scrimbaTotal.toLocaleString()}</strong></p>
                <hr />
                <p className="tool-calculator__savings">
                  You Save: ${savings.toLocaleString()}
                </p>
              </div>
              <AffiliateLink href="https://scrimba.com/pricing?via=u42d4986" variant="button">
                Claim 20% Off Pro
              </AffiliateLink>
            </div>
          </div>
        </div>

        <div className="margin-top--xl">
          <h2>Why the difference?</h2>
          <p>Bootcamps have high overhead (instructors, buildings, sales teams). Scrimba is self-paced and scalable. You get the same curriculum (HTML, CSS, JS, React) for a fraction of the price.</p>
          <p>Read our full analysis: <a href="/docs/pricing/scrimba-vs-bootcamps/">Scrimba vs Bootcamps Guide</a></p>
        </div>
      </div>
      </main>
    </Layout>
  );
}
