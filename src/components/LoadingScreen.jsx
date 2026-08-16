import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import './LoadingScreen.css'

function LoadingScreen({ onComplete }) {
  const screenRef = useRef(null)
  const glowRef = useRef(null)
  const logoRef = useRef(null)
  const line1Ref = useRef(null)
  const line2Ref = useRef(null)

  useGSAP(
    () => {
      const startDelay = 0.2

      const tl = gsap.timeline({
        delay: startDelay,
        defaults: { ease: 'power2.inOut' },
        onComplete: () => onComplete?.(),
      })

      const scaleDuration = 1.5
      const textStart = scaleDuration
      const lineFadeDuration = 1.7
      // logo keeps spinning through both lines of text, then eases to a stop
      const spinDuration = textStart + lineFadeDuration * 2

      tl.set(logoRef.current, { opacity: 0, scale: 0.1, rotate: 0 })
        .set([line1Ref.current, line2Ref.current], { opacity: 0 })

        // logo: scales up from 0.1 -> 1 while the spin (below) is already under way
        .to(
          logoRef.current,
          { scale: 1, duration: scaleDuration, ease: 'sine.out' },
          0,
        )
        // logo: fades in partway through the scale-up
        .to(
          logoRef.current,
          { opacity: 1, duration: 0.6, ease: 'sine.out' },
          0.23,
        )

        // logo: one continuous spin, fast at first then gradually slowing to a
        // graceful stop once the 2nd line finishes fading in (no seam/jump)
        .to(
          logoRef.current,
          {
            rotate: -1080,
            duration: spinDuration,
            ease: 'power3.out',
            force3D: true,
          },
          0,
        )

        // info lines start once the spinner has finished scaling in
        .to(
          line1Ref.current,
          { opacity: 1, duration: lineFadeDuration, ease: 'back.out(1.7)' },
          textStart,
        )
        .to(
          line2Ref.current,
          { opacity: 1, duration: lineFadeDuration, ease: 'back.out(1.7)' },
          '>',
        )

        // hold, then slide the whole screen up and out of view
        .to(screenRef.current, {
          yPercent: -100,
          duration: 0.8,
          ease: 'power3.inOut',
          delay: 0.5,
        })

      // center gently breathes from the moment the screen appears
      gsap.fromTo(
        glowRef.current,
        { opacity: 0.4, scale: 1 },
        {
          scale: 1.15,
          opacity: 0.55,
          duration: 2.6,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: startDelay,
        },
      )
    },
    { scope: screenRef },
  )

  return (
    <div className="loading-screen" ref={screenRef}>
      <div className="loading-glow" ref={glowRef} />
      <div className="loading-content">
        <img
          ref={logoRef}
          className="loading-logo"
          src="/gandhara_trail_logo.png"
          alt="The Gandhara Trail"
        />
        <h1 className="loading-title">The Gandhara Trail</h1>
        <div className="loading-info">
          <p ref={line1Ref}>
            The Gandhara Trail holds archaeological gems from ancient
            history.
          </p>
          <p ref={line2Ref}>
            Browse through ancient archaeological sites, discover their
            history and book tickets for the whole experience.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen
