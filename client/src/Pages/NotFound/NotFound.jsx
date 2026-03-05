const NotFound = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <iframe
        title="Yeti 404"
        src="/yeti-404/index.html"
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  );
};

export default NotFound;
