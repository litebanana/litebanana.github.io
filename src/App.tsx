import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Section from "./components/Section";
import ProjectCarousel from "./components/ProjectCarousel";
import Experience from "./components/Experience";
import Skills from "./components/Skills";
import About from "./components/About";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="relative min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-xl focus:bg-accent focus:px-4 focus:py-2 focus:font-extrabold focus:text-white"
      >
        Skip to content
      </a>

      <Navbar />

      <main id="main">
        <Hero />

        <Section
          id="projects"
          eyebrow="Projects"
          title="Things I've built"
          description="A few of my recent projects. Browse the carousel with the arrows, the dots, your keyboard arrows, or a swipe."
        >
          <ProjectCarousel />
        </Section>

        <Experience />
        <Skills />
        <About />
        <Contact />
      </main>

      <Footer />
    </div>
  );
}
