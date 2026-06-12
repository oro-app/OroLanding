import { PRODUCT_FAQS } from '../../lib/faqs'
import './ProductFaq.css'

export default function ProductFaq({ eyebrow = 'common questions.' }) {
  return (
    <section className="product-faq" aria-label="Common questions">
      <div className="product-faq-inner">
        <p className="product-faq-eyebrow">{eyebrow}</p>
        <div className="product-faq-list">
          {PRODUCT_FAQS.map((faq) => (
            <div className="product-faq-row" key={faq.question}>
              <h2 className="product-faq-question">{faq.question}</h2>
              <p className="product-faq-answer">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
