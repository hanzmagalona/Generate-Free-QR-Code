import React, { useState, useRef, useMemo } from 'react';
import QRCode from 'qrcode.react';
import {
  QrCode, Download, Link, FileText, Mail, MapPin, Phone, MessageCircle, Wifi, Contact, EyeOff, Eye
} from 'lucide-react';

// Define QR Code Types
type QrType = 'link' | 'text' | 'email' | 'location' | 'phone' | 'whatsapp' | 'wifi' | 'vcard';

// Define Form Data Structure for each type
interface FormData {
  link: { url: string };
  text: { content: string };
  email: { to: string; subject: string; body: string };
  location: { latitude: string; longitude: string };
  phone: { number: string };
  whatsapp: { number: string; message: string };
  wifi: { ssid: string; password: string; encryption: 'WPA' | 'WEP' | 'NONE'; hidden: boolean };
  vcard: {
    firstName: string;
    lastName: string;
    organization: string;
    title: string;
    phone: string;
    email: string;
    url: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

function App() {
  const [qrType, setQrType] = useState<QrType>('link');
  const [formData, setFormData] = useState<FormData>({
    link: { url: '' },
    text: { content: '' },
    email: { to: '', subject: '', body: '' },
    location: { latitude: '', longitude: '' },
    phone: { number: '', },
    whatsapp: { number: '', message: '' },
    wifi: { ssid: '', password: '', encryption: 'WPA', hidden: false },
    vcard: {
      firstName: '', lastName: '', organization: '', title: '',
      phone: '', email: '', url: '', address: '', city: '', state: '', zip: '', country: ''
    },
  });

  const [qrValue, setQrValue] = useState('');
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (type: QrType, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const generateQrCode = () => {
    let valueToEncode = '';
    let isValid = true;

    switch (qrType) {
      case 'link':
        valueToEncode = formData.link.url.trim();
        isValid = !!valueToEncode;
        break;
      case 'text':
        valueToEncode = formData.text.content.trim();
        isValid = !!valueToEncode;
        break;
      case 'email':
        const { to, subject, body } = formData.email;
        if (!to.trim()) { isValid = false; break; }
        valueToEncode = `mailto:${to.trim()}`;
        if (subject.trim() || body.trim()) {
          valueToEncode += `?subject=${encodeURIComponent(subject.trim())}&body=${encodeURIComponent(body.trim())}`;
        }
        break;
      case 'location':
        const { latitude, longitude } = formData.location;
        if (!latitude.trim() || !longitude.trim()) { isValid = false; break; }
        valueToEncode = `geo:${latitude.trim()},${longitude.trim()}`;
        break;
      case 'phone':
        valueToEncode = formData.phone.number.trim();
        isValid = !!valueToEncode;
        break;
      case 'whatsapp':
        const { number, message } = formData.whatsapp;
        if (!number.trim()) { isValid = false; break; }
        valueToEncode = `https://wa.me/${number.trim()}`;
        if (message.trim()) {
          valueToEncode += `?text=${encodeURIComponent(message.trim())}`;
        }
        break;
      case 'wifi':
        const { ssid, password, encryption, hidden } = formData.wifi;
        if (!ssid.trim()) { isValid = false; break; }
        valueToEncode = `WIFI:S:${ssid.trim()};T:${encryption};P:${password.trim()};H:${hidden ? 'true' : 'false'};`;
        break;
      case 'vcard':
        const v = formData.vcard;
        if (!v.firstName.trim() && !v.lastName.trim() && !v.organization.trim() && !v.phone.trim() && !v.email.trim()) {
          isValid = false;
          break;
        }
        valueToEncode = `BEGIN:VCARD\nVERSION:3.0\n`;
        if (v.firstName.trim() || v.lastName.trim()) valueToEncode += `N:${v.lastName.trim()};${v.firstName.trim()};;;\n`;
        if (v.firstName.trim() || v.lastName.trim()) valueToEncode += `FN:${v.firstName.trim()} ${v.lastName.trim()}\n`;
        if (v.organization.trim()) valueToEncode += `ORG:${v.organization.trim()}\n`;
        if (v.title.trim()) valueToEncode += `TITLE:${v.title.trim()}\n`;
        if (v.phone.trim()) valueToEncode += `TEL:${v.phone.trim()}\n`;
        if (v.email.trim()) valueToEncode += `EMAIL:${v.email.trim()}\n`;
        if (v.url.trim()) valueToEncode += `URL:${v.url.trim()}\n`;
        if (v.address.trim() || v.city.trim() || v.state.trim() || v.zip.trim() || v.country.trim()) {
          valueToEncode += `ADR:;;${v.address.trim()};${v.city.trim()};${v.state.trim()};${v.zip.trim()};${v.country.trim()}\n`;
        }
        valueToEncode += `END:VCARD`;
        break;
      default:
        isValid = false;
    }

    if (isValid && valueToEncode) {
      setQrValue(valueToEncode);
    } else {
      setQrValue('');
    }
  };

  const downloadPngQrCode = () => {
    if (qrCodeRef.current) {
      const svgElement = qrCodeRef.current.querySelector('svg');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          const pngFile = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngFile;
          downloadLink.download = 'qrcode.png';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          URL.revokeObjectURL(svgUrl);
        };
        img.src = svgUrl;
      }
    }
  };

  const downloadSvgQrCode = () => {
    if (qrCodeRef.current) {
      const svgElement = qrCodeRef.current.querySelector('svg');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'qrcode.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    }
  };

  const renderInputForm = useMemo(() => {
    const inputClass = "w-full p-3 rounded-xl bg-background border border-border text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300";
    const labelClass = "block text-textSecondary text-sm font-medium mb-2";

    switch (qrType) {
      case 'link':
        return (
          <div>
            <label htmlFor="link-url" className={labelClass}>URL:</label>
            <input
              id="link-url"
              type="url"
              value={formData.link.url}
              onChange={(e) => handleInputChange('link', 'url', e.target.value)}
              placeholder="e.g., https://stackblitz.com"
              className={inputClass}
            />
          </div>
        );
      case 'text':
        return (
          <div>
            <label htmlFor="text-content" className={labelClass}>Text Content:</label>
            <textarea
              id="text-content"
              value={formData.text.content}
              onChange={(e) => handleInputChange('text', 'content', e.target.value)}
              placeholder="Enter your message or any text here..."
              rows={4}
              className={`${inputClass} resize-y`}
            ></textarea>
          </div>
        );
      case 'email':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="email-to" className={labelClass}>Recipient Email:</label>
              <input
                id="email-to"
                type="email"
                value={formData.email.to}
                onChange={(e) => handleInputChange('email', 'to', e.target.value)}
                placeholder="e.g., info@example.com"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="email-subject" className={labelClass}>Subject (Optional):</label>
              <input
                id="email-subject"
                type="text"
                value={formData.email.subject}
                onChange={(e) => handleInputChange('email', 'subject', e.target.value)}
                placeholder="e.g., Inquiry about your service"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="email-body" className={labelClass}>Body (Optional):</label>
              <textarea
                id="email-body"
                value={formData.email.body}
                onChange={(e) => handleInputChange('email', 'body', e.target.value)}
                placeholder="Enter your email body here..."
                rows={3}
                className={`${inputClass} resize-y`}
              ></textarea>
            </div>
          </div>
        );
      case 'location':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="location-latitude" className={labelClass}>Latitude:</label>
              <input
                id="location-latitude"
                type="text"
                value={formData.location.latitude}
                onChange={(e) => handleInputChange('location', 'latitude', e.target.value)}
                placeholder="e.g., 34.0522"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="location-longitude" className={labelClass}>Longitude:</label>
              <input
                id="location-longitude"
                type="text"
                value={formData.location.longitude}
                onChange={(e) => handleInputChange('location', 'longitude', e.target.value)}
                placeholder="e.g., -118.2437"
                className={inputClass}
              />
            </div>
          </div>
        );
      case 'phone':
        return (
          <div>
            <label htmlFor="phone-number" className={labelClass}>Phone Number:</label>
            <input
              id="phone-number"
              type="tel"
              value={formData.phone.number}
              onChange={(e) => handleInputChange('phone', 'number', e.target.value)}
              placeholder="e.g., +15551234567"
              className={inputClass}
            />
          </div>
        );
      case 'whatsapp':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="whatsapp-number" className={labelClass}>WhatsApp Number (with country code):</label>
              <input
                id="whatsapp-number"
                type="tel"
                value={formData.whatsapp.number}
                onChange={(e) => handleInputChange('whatsapp', 'number', e.target.value)}
                placeholder="e.g., 15551234567"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="whatsapp-message" className={labelClass}>Pre-filled Message (Optional):</label>
              <textarea
                id="whatsapp-message"
                value={formData.whatsapp.message}
                onChange={(e) => handleInputChange('whatsapp', 'message', e.target.value)}
                placeholder="e.g., Hello, I'd like to know more..."
                rows={3}
                className={`${inputClass} resize-y`}
              ></textarea>
            </div>
          </div>
        );
      case 'wifi':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="wifi-ssid" className={labelClass}>Network Name (SSID):</label>
              <input
                id="wifi-ssid"
                type="text"
                value={formData.wifi.ssid}
                onChange={(e) => handleInputChange('wifi', 'ssid', e.target.value)}
                placeholder="e.g., MyHomeWifi"
                className={inputClass}
              />
            </div>
            <div className="relative">
              <label htmlFor="wifi-password" className={labelClass}>Password:</label>
              <input
                id="wifi-password"
                type={showPassword ? 'text' : 'password'}
                value={formData.wifi.password}
                onChange={(e) => handleInputChange('wifi', 'password', e.target.value)}
                placeholder="Leave blank if open network"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-textSecondary hover:text-primary focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div>
              <label htmlFor="wifi-encryption" className={labelClass}>Encryption Type:</label>
              <select
                id="wifi-encryption"
                value={formData.wifi.encryption}
                onChange={(e) => handleInputChange('wifi', 'encryption', e.target.value as 'WPA' | 'WEP' | 'NONE')}
                className={inputClass}
              >
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="NONE">None (Open)</option>
              </select>
            </div>
            <div className="flex items-center mt-2">
              <input
                id="wifi-hidden"
                type="checkbox"
                checked={formData.wifi.hidden}
                onChange={(e) => handleInputChange('wifi', 'hidden', e.target.checked)}
                className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
              />
              <label htmlFor="wifi-hidden" className="ml-2 text-textSecondary text-sm">
                Hidden Network
              </label>
            </div>
          </div>
        );
      case 'vcard':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="vcard-firstName" className={labelClass}>First Name:</label>
                <input
                  id="vcard-firstName"
                  type="text"
                  value={formData.vcard.firstName}
                  onChange={(e) => handleInputChange('vcard', 'firstName', e.target.value)}
                  placeholder="John"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="vcard-lastName" className={labelClass}>Last Name:</label>
                <input
                  id="vcard-lastName"
                  type="text"
                  value={formData.vcard.lastName}
                  onChange={(e) => handleInputChange('vcard', 'lastName', e.target.value)}
                  placeholder="Doe"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label htmlFor="vcard-organization" className={labelClass}>Organization:</label>
              <input
                id="vcard-organization"
                type="text"
                value={formData.vcard.organization}
                onChange={(e) => handleInputChange('vcard', 'organization', e.target.value)}
                placeholder="Acme Corp"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="vcard-title" className={labelClass}>Title:</label>
              <input
                id="vcard-title"
                type="text"
                value={formData.vcard.title}
                onChange={(e) => handleInputChange('vcard', 'title', e.target.value)}
                placeholder="Software Engineer"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="vcard-phone" className={labelClass}>Phone:</label>
              <input
                id="vcard-phone"
                type="tel"
                value={formData.vcard.phone}
                onChange={(e) => handleInputChange('vcard', 'phone', e.target.value)}
                placeholder="+15551234567"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="vcard-email" className={labelClass}>Email:</label>
              <input
                id="vcard-email"
                type="email"
                value={formData.vcard.email}
                onChange={(e) => handleInputChange('vcard', 'email', e.target.value)}
                placeholder="john.doe@example.com"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="vcard-url" className={labelClass}>Website/URL:</label>
              <input
                id="vcard-url"
                type="url"
                value={formData.vcard.url}
                onChange={(e) => handleInputChange('vcard', 'url', e.target.value)}
                placeholder="https://johndoe.com"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Address:</label>
              <input
                type="text"
                value={formData.vcard.address}
                onChange={(e) => handleInputChange('vcard', 'address', e.target.value)}
                placeholder="123 Main St"
                className={inputClass}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={formData.vcard.city}
                  onChange={(e) => handleInputChange('vcard', 'city', e.target.value)}
                  placeholder="Anytown"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={formData.vcard.state}
                  onChange={(e) => handleInputChange('vcard', 'state', e.target.value)}
                  placeholder="CA"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={formData.vcard.zip}
                  onChange={(e) => handleInputChange('vcard', 'zip', e.target.value)}
                  placeholder="90210"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={formData.vcard.country}
                  onChange={(e) => handleInputChange('vcard', 'country', e.target.value)}
                  placeholder="USA"
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  }, [qrType, formData, showPassword]);

  const qrTypeButtons = [
    { type: 'link', icon: Link, label: 'Link' },
    { type: 'text', icon: FileText, label: 'Text' },
    { type: 'email', icon: Mail, label: 'Email' },
    { type: 'location', icon: MapPin, label: 'Location' },
    { type: 'phone', icon: Phone, label: 'Phone' },
    { type: 'whatsapp', icon: MessageCircle, label: 'WhatsApp' },
    { type: 'wifi', icon: Wifi, label: 'WiFi' },
    { type: 'vcard', icon: Contact, label: 'vCard' },
  ];

  return (
    <div className="min-h-screen bg-background text-text font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
          alt="Abstract background"
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/80 to-background/95"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 w-full max-w-4xl text-center py-8 mb-8">
        <h1 className="text-5xl font-extrabold text-primary drop-shadow-lg flex items-center justify-center gap-4 animate-fade-in-down">
          <QrCode size={48} className="text-accent" />
          Generate Free QR Code
        </h1>
        <p className="text-textSecondary text-lg mt-2 animate-fade-in-up">
          Instantly generate beautiful QR codes for anything.
        </p>
      </header>

      {/* Main Content Card */}
      <main className="relative z-10 bg-surface border border-border rounded-3xl shadow-2xl p-8 w-full max-w-2xl flex flex-col items-center space-y-6 animate-scale-in">
        {/* QR Type Selection */}
        <h2 className="text-2xl font-bold text-text w-full text-left mb-4">Choose QR Code Data Type</h2>
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 mb-6">
          {qrTypeButtons.map((button) => (
            <button
              key={button.type}
              onClick={() => {
                setQrType(button.type as QrType);
                setQrValue(''); // Clear QR on type change
              }}
              className={`
                flex flex-col items-center justify-center p-3 rounded-xl text-sm font-medium
                transition-all duration-300 ease-in-out
                ${qrType === button.type
                  ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg'
                  : 'bg-background text-textSecondary hover:bg-surface-light hover:text-text border border-border'
                }
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface
              `}
            >
              <button.icon size={24} className="mb-1" />
              {button.label}
            </button>
          ))}
        </div>

        {/* Dynamic Input Form for Data Type */}
        <div className="w-full animate-fade-in">
          {renderInputForm}
        </div>

        <button
          onClick={generateQrCode}
          className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface"
        >
          Generate QR Code
        </button>

        {qrValue && (
          <div className="flex flex-col items-center space-y-4 w-full animate-fade-in">
            <div
              ref={qrCodeRef}
              className="p-4 bg-white rounded-xl shadow-inner border border-gray-200 flex items-center justify-center"
            >
              <QRCode
                value={qrValue}
                size={256}
                level="H"
                renderAs="svg"
                fgColor="#171717"
                bgColor="#FFFFFF"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <button
                onClick={downloadPngQrCode}
                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-secondary to-blue-400 text-white font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-surface flex items-center justify-center gap-2"
              >
                <Download size={20} /> Download PNG
              </button>
              <button
                onClick={downloadSvgQrCode}
                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-surface flex items-center justify-center gap-2"
              >
                <Download size={20} /> Download SVG
              </button>
            </div>
          </div>
        )}

        {!qrValue && (
          <p className="text-textSecondary text-center animate-fade-in">
            Select a QR code type and enter the required information to generate your QR code.
          </p>
        )}
      </main>
    </div>
  );
}

export default App;
