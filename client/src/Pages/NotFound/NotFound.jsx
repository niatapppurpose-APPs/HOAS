const NotFound = () => {
  return (
    <main className="h-screen w-full overflow-hidden bg-[#09334f]">
      <iframe
        title="HOAS page not found"
        src={`${import.meta.env.BASE_URL}yeti-404/index.html`}
        className="h-full w-full border-0"
        loading="eager"
      />
    </main>
  );
};

export default NotFound;
