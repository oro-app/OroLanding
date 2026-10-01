import './SmsBubble.css'

export default function SmsBubble({ children, tone = 'cream', side = 'left', className = '', avatar }) {
  return (
    <>
      {avatar && <img className="sms-avatar" src={avatar} alt="" width="44" height="44" loading="lazy" decoding="async" />}
      <div className={`sms-bubble sms-bubble--${tone} sms-bubble--${side} ${className}`.trim()}>
        {children}
      </div>
    </>
  )
}
