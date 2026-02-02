import { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    inquiryType: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Message Sent. Our engineers will contact you.');
    setFormData({ name: '', inquiryType: '', message: '' });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section style={{ 
      padding: '140px 40px 80px', 
      minHeight: '100vh' 
    }} className="section-enter">
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '80px'
      }}>
        <div>
          <h2 style={{ 
            fontSize: '3rem', 
            marginBottom: '24px',
            letterSpacing: '-0.02em'
          }}>
            GET IN TOUCH
          </h2>
          <p style={{ marginBottom: '40px', opacity: 0.7 }}>
            Technical support, bulk orders, or custom tool fabrication inquiries.
          </p>

          <div style={{ marginBottom: '32px' }}>
            <h5 style={{ 
              textTransform: 'uppercase', 
              fontSize: '0.7rem', 
              letterSpacing: '0.1em', 
              color: 'var(--tension-accent)',
              marginBottom: '8px'
            }}>
              Email
            </h5>
            <p style={{ fontFamily: 'var(--font-mono)' }}>
              ops@drywalltoolbox.com
            </p>
          </div>

          <div>
            <h5 style={{ 
              textTransform: 'uppercase', 
              fontSize: '0.7rem', 
              letterSpacing: '0.1em', 
              color: 'var(--tension-accent)',
              marginBottom: '8px'
            }}>
              Headquarters
            </h5>
            <p style={{ fontFamily: 'var(--font-mono)' }}>
              1024 Precision Way, Alloy Park<br />
              Industrial District, TX 75001
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="machined-label">Full Name</label>
            <input 
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className="machined-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="machined-label">Inquiry Type</label>
            <input 
              type="text"
              name="inquiryType"
              value={formData.inquiryType}
              onChange={handleChange}
              placeholder="Technical Support"
              className="machined-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="machined-label">Message</label>
            <textarea 
              rows="5"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="How can we help?"
              className="machined-textarea"
              required
            />
          </div>

          <button 
            type="submit" 
            className="alloy-button" 
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Submit Inquiry
          </button>
        </form>
      </div>
    </section>
  );
}
