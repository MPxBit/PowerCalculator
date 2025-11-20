import '../styles/globals.css';

export const metadata = {
  title: 'RV Battery Amp-Hour Calculator',
  description: 'Calculate how many battery amp-hours you need to power your RV appliances',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}



