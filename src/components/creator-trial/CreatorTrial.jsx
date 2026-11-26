import { useEffect, useRef } from 'react'
import { Heading, Text } from 'oro-kit'
import wardrobePreview from '../../assets/demos/camera-roll-closet-polaroid-v3.webp'
import outfitSwap from '../../assets/demos/outfit-iteration-mens.webp'
import outfitCollage from '../../assets/fit-gen-demo/collage.webp'
import oroWaving from '../../assets/mascot/oro_hi.webp'
import oroTexting from '../../assets/mascot/oro_texting.webp'
import ButtonArrow from '../ButtonArrow'
import GoldBackground from '../GoldBackground'
import { HomeCta } from '../home/HomeChrome'
import '../creator-pilot/CreatorPilot.css'
import { audiences, evaluation, features, journey, resourceLibraryUrl, resources, timeline, videoIdeasUrl } from './trialContent'
import './CreatorTrial.css'

const email = 'sunny@askoro.now'
const contactUrl = `mailto:${email}`
const accessUrl = `${contactUrl}?subject=${encodeURIComponent('Create with oro trial access')}&body=${encodeURIComponent('Hi Sunny,\r\n\r\nI’d like complimentary access to oro for my creator trial.\r\n\r\nEmail address: \r\niMessage phone number (including country code): \r\n\r\nThanks!')}`

const sections = {
  welcome: 'Welcome',
  'meet-oro': 'Meet oro',
  showcase: 'What you can showcase',
  audience: 'Who we’re creating for',
  direction: 'Creative direction',
  resources: 'Creative resources',
  evaluation: 'Evaluation',
  'your-trial': 'Trial instructions and timeline',
}

const contentsLabels = {
  showcase: 'What to showcase',
  audience: 'Audience',
  resources: 'Resources',
  'your-trial': 'Your trial',
}

const journeyImages = {
  'Meet your stylist': { src: oroTexting, width: 1500, height: 1500, alt: '' },
  'Build your wardrobe': { src: wardrobePreview, width: 1254, height: 1254, alt: 'Photos of clothes and outfits ready to add to an oro wardrobe' },
  'Get styled': { src: outfitCollage, width: 1086, height: 1448, alt: 'An oro outfit collage with jeans, a cream cardigan, and red accessories' },
  'Refine and explore': { src: outfitSwap, width: 1254, height: 1254, alt: 'Two outfit collages showing oro swap shorts for cargo pants over text' },
}

const requirements = [
  'Mention oro by name at least once, verbally or on screen. Always write oro in lowercase.',
  'Show oro or what it helps you do, and give viewers a reason to care.',
  'Include a clear call to action in the video or caption.',
  'Reply to viewers who respond to your comment-based call to action, and answer relevant comments and questions about oro.',
  'Clearly disclose your promotional relationship with oro and use the platform’s applicable disclosure settings.',
  'Keep product claims accurate.',
]

const tips = [
  'Lead with what someone gains from using oro.',
  'Create for a specific audience or community.',
  'Make the video feel at home in your existing content.',
  'Humor, sarcasm, memes, slang, and playful controversial hooks are welcome.',
]

const featureOutcomes = [
  ['Digital wardrobe', 'Unlock better outfits from clothes you already own.'],
  ['Outfit generation', 'Spend less time stressing about what to wear.'],
  ['Outfit feedback', 'Feel more confident before leaving the house.'],
  ['Conversational styling', 'Have a personal stylist you can text whenever you need help.'],
  ['Shopping advice', 'Make more intentional clothing purchases.'],
  ['iMessage', 'Outsource styling decisions without downloading another app.'],
]

const postingRequirements = [
  'Publish at least one short-form video featuring oro on TikTok or Instagram Reels. Additional attempts are optional.',
  'Make your submitted video publicly accessible.',
  'Use organic distribution only. Paid promotion, purchased views, and artificial engagement are prohibited.',
  'Keep your submitted video live throughout the assessment window.',
  'Meet the posting and analytics submission deadlines.',
]

function Section({ id, children }) {
  return (
    <section id={id} className="pilot-section pilot-container trial-anchor" aria-labelledby={`${id}-title`}>
      <Heading as="h2" variant="title" id={`${id}-title`} data-trial-reveal="">{sections[id]}</Heading>
      {children}
    </section>
  )
}

function Bullets({ items }) {
  return <ul className="pilot-bullets">{items.map(item => <li key={item}>{item}</li>)}</ul>
}

function ResourceLink({ href, children }) {
  return (
    <a className="pilot-about-link" href={href} target="_blank" rel="noreferrer">
      {children}<ButtonArrow direction="up-right" className="pilot-arrow" />
    </a>
  )
}

export default function CreatorTrial() {
  const pageRef = useRef(null)

  useEffect(() => {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const groups = [...pageRef.current.querySelectorAll('[data-trial-reveal]')]
      .filter(group => group.getBoundingClientRect().top >= window.innerHeight)
    const observer = new IntersectionObserver(entries => {
      for (const { isIntersecting, target } of entries) {
        if (!isIntersecting) continue
        delete target.dataset.trialPending
        observer.unobserve(target)
      }
    })

    for (const group of groups) {
      group.dataset.trialPending = ''
      observer.observe(group)
    }

    return () => {
      observer.disconnect()
      for (const group of groups) delete group.dataset.trialPending
    }
  }, [])

  return (
    <div className="creator-pilot creator-trial" ref={pageRef}>
      <GoldBackground />

      <section id="welcome" className="pilot-intro trial-anchor" aria-labelledby="welcome-title">
        <div className="pilot-container trial-hero">
          <Heading as="h1" variant="display" id="welcome-title" className="pilot-title">
            Welcome to<br />Create with oro! <span className="trial-heart" aria-hidden="true">💜</span>
          </Heading>
          <Text muted className="pilot-lede">We’re so excited to have you here! You were shortlisted for a reason, and we want to give you everything you need to make your best video.</Text>
          <Text muted className="trial-hero-copy">Your trial package brings together what you need to understand oro, find a creative angle, use the resources, and complete your trial.</Text>
          <div className="trial-actions">
            <a className="oro-button oro-button--primary halo-cta" href={resourceLibraryUrl} target="_blank" rel="noreferrer">
              Creative Resource Library
            </a>
          </div>
          <nav className="trial-contents" aria-label="On this page">
            <Heading as="h2" variant="subheading">On this page</Heading>
            <ul>
              {Object.entries(sections).map(([id, label]) => (
                <li key={id}><a href={`#${id}`}>{contentsLabels[id] || label}</a></li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      <section id="meet-oro" className="pilot-section pilot-container trial-anchor" aria-labelledby="meet-oro-title">
        <div className="trial-meet" data-trial-reveal="">
          <div>
            <Heading as="h2" variant="title" id="meet-oro-title">{sections['meet-oro']}</Heading>
            <div className="trial-copy">
              <Text muted>oro is an AI personal stylist that lives in your iMessage.</Text>
              <Text muted>She learns your style and puts together outfits using clothes you already own. Think of her as that effortlessly stylish best friend you can text whenever you don’t know what to wear.</Text>
            </div>
          </div>
          <img className="trial-mascot" src={oroWaving} alt="oro, waving in her lavender cape" width="1500" height="1500" loading="lazy" decoding="async" />
        </div>
        <div className="trial-block">
          <Heading as="h3" variant="subheading" className="trial-subtitle" data-trial-reveal="">The user journey</Heading>
          <ol className="trial-journey" role="list">
            {journey.map(([title, description], index) => (
              <li className="trial-journey-step" key={title} data-trial-reveal="">
                <span className="trial-journey-number" aria-hidden="true">{index + 1}</span>
                <div className="trial-journey-detail">
                  <div>
                    <Heading as="h4" variant="subheading">{title}</Heading>
                    <Text muted>{index === 0 ? <>Visit <a href="/">askoro.now</a> to get started with oro.</> : description}</Text>
                  </div>
                  {journeyImages[title] && <img className="trial-journey-image" {...journeyImages[title]} loading="lazy" decoding="async" />}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Section id="showcase">
        <Text muted className="trial-lede" data-trial-reveal="">Pick the features that fit your idea. One well-chosen feature can carry a whole video.</Text>
        <ul className="trial-showcase" role="list">
          {features.map(({ title, description, examples }) => (
            <li key={title} data-trial-reveal="">
              <Heading as="h3" variant="subheading">{title}</Heading>
              <div>
                <Text muted>{description}</Text>
                {examples && <Text className="trial-showcase-example">{examples[0]}</Text>}
              </div>
            </li>
          ))}
        </ul>
        <div className="pilot-disclosures trial-example-disclosure" data-trial-reveal="">
          <details>
            <summary>More examples<span className="pilot-disclosure-icon" aria-hidden="true" /></summary>
            <div className="trial-more-examples">
              {features.filter(({ examples }) => examples?.length > 1).map(({ title, examples }) => (
                <div className="trial-list-group" key={title}>
                  <Heading as="h3" variant="subheading">{title}</Heading>
                  <Bullets items={examples.slice(1)} />
                </div>
              ))}
            </div>
          </details>
        </div>
      </Section>

      <Section id="audience">
        <div className="trial-copy" data-trial-reveal="">
          <Text muted>We’re creating for people who care about <strong>the outcome of dressing well</strong> and could use help getting there. They may be short on time or confidence, or simply want someone else to figure out what works.</Text>
          <Text muted>Use these audiences and angles as starting points and feel free to explore the communities you understand best.</Text>
        </div>
        <div className="pilot-disclosures">
          {audiences.map(({ title, description, painPoints, outcomes, angles }) => (
            <details key={title} data-trial-reveal="">
              <summary>{title}<span className="pilot-disclosure-icon" aria-hidden="true" /></summary>
              <div className="trial-audience">
                <Text muted>{description}</Text>
                <div className="trial-grid trial-list-group">
                  <div><Heading as="h3" variant="subheading">Pain points</Heading><Bullets items={painPoints} /></div>
                  <div><Heading as="h3" variant="subheading">Desired outcomes</Heading><Bullets items={outcomes} /></div>
                </div>
                <Text muted><strong>Content angles</strong> · {angles}</Text>
              </div>
            </details>
          ))}
        </div>
      </Section>

      <Section id="direction">
        <div className="trial-copy" data-trial-reveal="">
          <Text muted>We trust your creative vision! Use our example scripts, adapt them to your style, recreate a reference format with your own footage, or come up with your own concept. Go with the approach you genuinely think will perform best.</Text>
        </div>
        <div className="trial-block trial-list-group" data-trial-reveal="">
          <Heading as="h3" variant="subheading" className="trial-subtitle">Content requirements</Heading>
          <Bullets items={requirements} />
        </div>
        <div className="trial-block trial-list-group" data-trial-reveal="">
          <Heading as="h3" variant="subheading" className="trial-subtitle">Optional creative tips</Heading>
          <Bullets items={tips} />
        </div>
        <div className="trial-block trial-list-group" data-trial-reveal="">
          <Heading as="h3" variant="subheading" id="outcome-title" className="trial-subtitle">Selling the outcome</Heading>
          <table className="trial-outcomes" aria-labelledby="outcome-title">
            <thead><tr><th scope="col">Feature</th><th scope="col">Potential outcome</th></tr></thead>
            <tbody>
              {featureOutcomes.map(([feature, outcome]) => (
                <tr key={feature}><th scope="row">{feature}</th><td>{outcome}</td></tr>
              ))}
            </tbody>
          </table>
          <Text muted>“This AI digitizes your wardrobe” describes a feature. “Can AI turn me into the girl on my Pinterest board without buying new clothes?” gives your audience an outcome to care about.</Text>
        </div>
      </Section>

      <Section id="resources">
        <Text muted className="trial-lede" data-trial-reveal="">We’ve put together assets, reference videos, and scripts to help you create your best content.</Text>
        <ResourceLink href={resourceLibraryUrl}>Open the complete resource library</ResourceLink>
        <ul className="trial-grid trial-resource-grid">
          {resources.map(({ title, description, href }) => (
            <li key={title} data-trial-reveal="">
              <a className="pilot-pay trial-card trial-resource" href={href} target="_blank" rel="noreferrer">
                <div className="trial-resource-title">
                  <Heading as="h3" variant="subheading">{title}</Heading>
                  <ButtonArrow direction="up-right" className="pilot-arrow" />
                </div>
                <Text muted>{description}</Text>
              </a>
            </li>
          ))}
        </ul>
        <div className="trial-copy" data-trial-reveal="">
          <Text muted>Use the scripts as written or make the hooks your own.</Text>
          <ResourceLink href={videoIdeasUrl}>Explore video ideas &amp; scripts</ResourceLink>
        </div>
        <Text muted className="trial-resource-note" data-trial-reveal="">When adapting a reference, use your own or appropriately licensed materials. Feel free to edit supplied demo clips and present them as product demonstrations.</Text>
        <div className="pilot-pay trial-block trial-callout" data-trial-reveal="">
          <Heading as="h3" variant="title">Want to try oro yourself?</Heading>
          <Text muted>We’re happy to give you complimentary access throughout your trial. Try styling an outfit or capture your own footage.</Text>
          <div className="trial-list-group">
            <Text muted>Send both details to <a href={contactUrl}>{email}</a>.</Text>
            <Bullets items={['Your email address', 'Your iMessage phone number, including country code']} />
          </div>
          <Text muted>Just say you’d like access and I’ll get you set up.</Text>
          <div className="trial-actions"><HomeCta place="closer" href={accessUrl} showIcon={false}>Request access</HomeCta></div>
        </div>
        <div className="trial-block trial-list-group" data-trial-reveal="">
          <Heading as="h3" variant="subheading" className="trial-subtitle">We’re here to help you succeed 💜</Heading>
          <Text muted>You were shortlisted for a reason. I see potential in your content and want to help you make the best video you can.</Text>
          <Text muted>Reach out for product demos, a specific screenshot, brand assets, brainstorming, creative feedback, or help filming. If you need something you can’t find in the library, just ask!</Text>
        </div>
      </Section>

      <Section id="evaluation">
        <Text muted className="trial-lede" data-trial-reveal="">We’re looking for engaging, high-performing content. Performance carries the most weight, and we’ll also assess how effectively you execute the video.</Text>
        <div className="trial-grid">
          {evaluation.map(({ title, weight, criteria }) => (
            <div className="pilot-pay trial-card trial-evaluation" key={title} data-trial-reveal="">
              <Heading as="h3" variant="subheading">{title} <span>{weight}%</span></Heading>
              <dl>
                {criteria.map(criterion => (
                  <div key={criterion.title}>
                    <dt>{criterion.title} <span>{criterion.weight}%</span></dt>
                    <dd>{criterion.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        <div className="trial-copy" data-trial-reveal="">
          <Text muted>Simple footage and editing can be just as effective as an elaborate production. Supplied formats and original concepts are evaluated by the same criteria.</Text>
          <Text muted>If you make multiple videos, choose the single video you’d like us to evaluate.</Text>
        </div>
      </Section>

      <Section id="your-trial">
        <div className="trial-block trial-list-group" data-trial-reveal="">
          <Heading as="h3" variant="subheading" className="trial-subtitle">Posting requirements</Heading>
          <Bullets items={postingRequirements} />
          <Text muted>We encourage you to use your existing account and audience. That’s optional. The video’s performance is our biggest priority.</Text>
          <Text muted>You can publish whenever you think is best within your trial window, without draft approval.</Text>
        </div>
        <div className="trial-block trial-list-group">
          <Heading as="h3" variant="subheading" className="trial-subtitle" data-trial-reveal="">Timeline</Heading>
          <ol className="pilot-list trial-timeline">
            {timeline.map(([isoDate, displayDate, description]) => (
              <li key={isoDate} data-trial-reveal="">
                <time dateTime={isoDate}>{displayDate}</time>
                <Text muted>{description}</Text>
              </li>
            ))}
          </ol>
          <Text muted data-trial-reveal="">All deadlines are in Eastern Time. If you’ve arranged an alternative deadline with us, follow your individually confirmed timeline and Trial Agreement.</Text>
        </div>
        <div className="trial-block">
          <Heading as="h3" variant="subheading" className="trial-subtitle" data-trial-reveal="">How to submit</Heading>
          <ol className="pilot-list trial-numbered">
            <li data-trial-reveal="">
              <span className="trial-step-number" aria-hidden="true">01</span>
              <div>
                <Heading as="h4" variant="subheading">Select your video</Heading>
                <Text muted>If you made multiple videos, choose one for evaluation with the criteria above in mind. If you cross-posted the same video, choose one platform’s post.</Text>
              </div>
            </li>
            <li data-trial-reveal="">
              <span className="trial-step-number" aria-hidden="true">02</span>
              <div>
                <Heading as="h4" variant="subheading">Submit your video link</Heading>
                <Text muted>Reply to your original email thread or email <a href={contactUrl}>{email}</a> with the published link to your selected video.</Text>
              </div>
            </li>
            <li data-trial-reveal="">
              <span className="trial-step-number" aria-hidden="true">03</span>
              <div className="trial-list-group">
                <Heading as="h4" variant="subheading">Submit your analytics</Heading>
                <Text muted>Capture unaltered screenshots of your video’s native platform analytics 48 hours after publication and send them to the same email address.</Text>
                <Bullets items={['Views', 'Audience retention data', 'Shares']} />
                <Text muted>Let us know if a metric is unavailable. If you make multiple videos, capture each video’s analytics at the 48-hour mark so you can decide which one to submit. Plan your posting schedule around the submission deadlines.</Text>
              </div>
            </li>
          </ol>
          <Text muted data-trial-reveal="">We’ll evaluate one video per creator.</Text>
        </div>
        <div className="pilot-pay trial-block trial-list-group" data-trial-reveal="">
          <Heading as="h3" variant="subheading" className="trial-subtitle">Trial compensation</Heading>
          <Text muted>If you’re selected and join the program, we’ll pay for your reviewed trial video on top of your regular earnings.</Text>
          <Bullets items={['C$25 base payment', 'C$1 per 1,000 eligible organic views, measured 48 hours after publication', 'Up to C$100 in total trial compensation']} />
          <Text muted>Refer to your Trial Agreement for the full terms.</Text>
        </div>
      </Section>

      <section className="pilot-section pilot-container trial-closer" aria-labelledby="trial-closer-title" data-trial-reveal="">
        <Heading as="h2" variant="title" id="trial-closer-title">Let’s create! 💜</Heading>
        <div className="trial-copy">
          <Text muted>Have a question, need a specific resource, or want complimentary access to oro? Email <a href={contactUrl}>{email}</a> anytime.</Text>
          <Text muted>We’re genuinely excited to see what you create. Have fun with it, experiment, and make it your own!</Text>
        </div>
        <div className="trial-actions"><HomeCta place="closer" href={contactUrl} showIcon={false}>Contact Sunny</HomeCta></div>
      </section>
    </div>
  )
}
