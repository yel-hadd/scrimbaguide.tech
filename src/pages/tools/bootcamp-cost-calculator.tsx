import React, { useState } from 'react';
import Layout from '@theme/Layout';
import AffiliateLink from '@site/src/components/AffiliateLink';

export default function BootcampCalculator(): React.ReactElement {
  const [bootcampCost, setBootcampCost] = useState(14000);
  const [durationMonths, setDurationMonths] = useState(6);
  const [loanInterest, setLoanInterest] = useState(5); // %

  const scrimbaMonthly = 30; // approx
  const scrimbaTotal = scrimbaMonthly * durationMonths;
  
  const loanTotal = bootcampCost * (1 + (loanInterest / 100));
  const savings = loanTotal - scrimbaTotal;

  return (
    <Layout title="Bootcamp Cost Calculator" description="Calculate how much you save with Scrimba vs a traditional coding bootcamp.">
      <main>
      <div className="container margin-vert--lg">
        <h1>Bootcamp Cost Calculator</h1>
        <p>Compare the cost of a traditional coding bootcamp vs Scrimba Pro.</p>

        <div className="row">
          <div className="col col--6">
            <div className="card padding--lg">
              <h2>Bootcamp Assumptions</h2>
              <div className="margin-bottom--md">
                <label htmlFor="bootcamp-tuition" style={{display: 'block', fontWeight: 'bold'}}>Tuition Cost ($)</label>
                <input 
                  id="bootcamp-tuition"
                  type="number" 
                  value={bootcampCost} 
                  onChange={(e) => setBootcampCost(Number(e.target.value))}
                  style={{width: '100%', padding: '0.5rem'}}
                />
              </div>
              <div className="margin-bottom--md">
                <label htmlFor="bootcamp-duration" style={{display: 'block', fontWeight: 'bold'}}>Duration (Months)</label>
                <input 
                  id="bootcamp-duration"
                  type="number" 
                  value={durationMonths} 
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  style={{width: '100%', padding: '0.5rem'}}
                />
              </div>
              <div className="margin-bottom--md">
                <label htmlFor="bootcamp-interest" style={{display: 'block', fontWeight: 'bold'}}>Loan Interest Rate (%)</label>
                <input 
                  id="bootcamp-interest"
                  type="number" 
                  value={loanInterest} 
                  onChange={(e) => setLoanInterest(Number(e.target.value))}
                  style={{width: '100%', padding: '0.5rem'}}
                />
              </div>
            </div>
          </div>

          <div className="col col--6">
            <div className="card padding--lg" style={{backgroundColor: 'var(--ifm-color-emphasis-100)'}}>
              <h2>Your Savings</h2>
              <div className="margin-bottom--md">
                <p>Bootcamp Total (with interest): <strong>${loanTotal.toLocaleString()}</strong></p>
                <p>Scrimba Total: <strong>${scrimbaTotal.toLocaleString()}</strong></p>
                <hr />
                <h2 style={{color: 'var(--ifm-color-success)'}}>You Save: ${savings.toLocaleString()}</h2>
              </div>
              <AffiliateLink href="https://scrimba.com/pricing?via=u42d4986" variant="button">
                Start Scrimba Pro
              </AffiliateLink>
            </div>
          </div>
        </div>

        <div className="margin-top--xl">
          <h2>Why the difference?</h2>
          <p>Bootcamps have high overhead (instructors, buildings, sales teams). Scrimba is self-paced and scalable. You get the same curriculum (HTML, CSS, JS, React) for a fraction of the price.</p>
          <p>Read our full analysis: <a href="/docs/pricing/scrimba-vs-bootcamps">Scrimba vs Bootcamps Guide</a></p>
        </div>
      </div>
      </main>
    </Layout>
  );
}
