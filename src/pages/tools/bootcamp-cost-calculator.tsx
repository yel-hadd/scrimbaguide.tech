import React, { useState } from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import AffiliateLink from '@site/src/components/AffiliateLink';

export default function BootcampCalculator(): React.ReactElement {
  const [bootcampCost, setBootcampCost] = useState(14000);
  const [durationMonths, setDurationMonths] = useState(6);
  const [loanInterest, setLoanInterest] = useState(5); // %
  // Left to the reader rather than hardcoded: Scrimba applies regional (PPP)
  // pricing, so any figure we ship here would be wrong for most visitors and
  // would drift. 0 means "not filled in yet" and suppresses the comparison.
  const [subscriptionMonthly, setSubscriptionMonthly] = useState(0);

  const subscriptionTotal = subscriptionMonthly * durationMonths;
  const loanTotal = bootcampCost * (1 + (loanInterest / 100));
  const savings = loanTotal - subscriptionTotal;
  const hasSubscriptionPrice = subscriptionMonthly > 0;
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
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            '@id': `${canonicalUrl}/#faq`,
            mainEntityOfPage: `${canonicalUrl}/`,
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Why does the calculator not fill in the Scrimba price for me?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Scrimba applies regional (purchasing power) pricing, so the monthly figure differs by country and changes over time. Any hardcoded number would be wrong for most visitors, so you enter the price shown on the pricing page for your country.',
                },
              },
              {
                '@type': 'Question',
                name: 'Is a coding bootcamp worth the money?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'It depends what you are buying. If you need deadlines, a cohort, and career support to finish, that structure has real value. If you already study consistently on your own, you are mostly paying for accountability you may not need.',
                },
              },
              {
                '@type': 'Question',
                // Must match the visible <h3> and its paragraph verbatim. The
                // question used to read "Does the bootcamp cost comparison
                // include lost income?" and the answer paraphrased the page,
                // which is markup asserting content no reader sees.
                name: 'Does this include the cost of not working?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'No, and it is usually the biggest number in the comparison. A six-month full-time bootcamp can cost a half-year of salary on top of tuition. Part-time and self-paced options avoid most of that.',
                },
              },
            ],
          })}
        </script>
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
              <div className="margin-bottom--md">
                <label htmlFor="subscription-monthly" className="tool-calculator__input-label">
                  Subscription price per month ($)
                </label>
                <input
                  id="subscription-monthly"
                  type="number"
                  min={0}
                  value={subscriptionMonthly || ''}
                  placeholder="Enter the price you see"
                  onChange={(e) => setSubscriptionMonthly(Number(e.target.value))}
                  className="tool-calculator__input"
                />
                <small>
                  Scrimba prices by region, so we do not guess for you. Check{' '}
                  <AffiliateLink href="https://scrimba.com/our-pricing" location="calculator-price-input">
                    current plans
                  </AffiliateLink>{' '}
                  and enter the monthly figure shown for your country.
                </small>
              </div>
            </div>
          </div>

          <div className="col col--6">
            <div className="card padding--lg tool-calculator__results">
              <h2>Your Savings</h2>
              <div className="margin-bottom--md">
                <p>Bootcamp Total (with interest): <strong>${loanTotal.toLocaleString()}</strong></p>
                {hasSubscriptionPrice ? (
                  <>
                    <p>
                      Subscription Total ({durationMonths} months):{' '}
                      <strong>${subscriptionTotal.toLocaleString()}</strong>
                    </p>
                    <hr />
                    <p className="tool-calculator__savings">
                      You Save: ${savings.toLocaleString()}
                    </p>
                  </>
                ) : (
                  <>
                    <hr />
                    <p>
                      Add a subscription price on the left to see the gap. Without it, the
                      bootcamp total above is the only number we can honestly show you.
                    </p>
                  </>
                )}
              </div>
              <AffiliateLink href="https://scrimba.com/our-pricing" variant="button">
                Claim 20% off Pro
              </AffiliateLink>
            </div>
          </div>
        </div>

        <div className="margin-top--xl">
          <h2>How this calculator works</h2>
          <p>
            The maths is deliberately simple, so you can check it. Bootcamp total is tuition
            plus one flat application of your interest rate, which approximates a loan you
            clear reasonably quickly. Subscription total is the monthly price you enter
            multiplied by the number of months. The difference is what you would keep.
          </p>
          <p>
            Two things it does not model, both of which matter. It ignores lost income: most
            full-time bootcamps expect you to stop working, and for many people that forgone
            salary is larger than the tuition. It also ignores what a bootcamp adds beyond
            video, namely cohort structure, deadlines, and career services. If those are the
            reason you are considering one, a price gap alone should not decide it.
          </p>

          <h2>Why the difference is so large</h2>
          <p>
            Bootcamps carry costs a self-paced platform does not: live instructors, cohort
            scheduling, admissions and sales teams, and often physical space. A subscription
            platform spreads one recording across every learner. The curriculum overlap is
            real (HTML, CSS, JavaScript, React), so the gap reflects delivery model far more
            than it reflects content.
          </p>
          <p>
            The honest caveat is completion. A bootcamp's structure is what many people are
            actually buying, and self-paced learning has a well-known drop-off problem. The
            cheaper option is only cheaper if you finish it.
          </p>
          <p>Read our full analysis: <a href="/docs/pricing/scrimba-vs-bootcamps/">Scrimba vs Bootcamps Guide</a></p>

          <h2>Frequently asked questions</h2>
          <h3>Why does the calculator not fill in the Scrimba price for me?</h3>
          <p>
            Because there is no single price to fill in. Scrimba applies regional (purchasing
            power) pricing, so the monthly figure differs by country and changes over time.
            Any number hardcoded here would be wrong for most visitors. Check{' '}
            <AffiliateLink href="https://scrimba.com/our-pricing" location="calculator-faq">
              current plans
            </AffiliateLink>{' '}
            and enter what you actually see.
          </p>
          <h3>Is a coding bootcamp worth the money?</h3>
          <p>
            It depends on what you are buying. If you need deadlines, a cohort, and career
            support to finish, that structure has real value. If you are self-directed and
            already study consistently, you are mostly paying for accountability you may not
            need. Run the numbers above, then add your forgone salary.
          </p>
          <h3>Does this include the cost of not working?</h3>
          <p>
            No, and it is usually the biggest number in the comparison. A six-month full-time
            bootcamp can cost a half-year of salary on top of tuition. Part-time and
            self-paced options avoid most of that.
          </p>
        </div>
      </div>
      </main>
    </Layout>
  );
}
