import ApplicationForm from "../components/ApplicationForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 py-12">
      <div className="container mx-auto">
        <ApplicationForm />
      </div>
    </main>
  );
}