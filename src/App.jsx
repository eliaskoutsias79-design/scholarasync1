import React from "react";
import { LanguageProvider } from "./contexts/LanguageContext";
import ScholarAsync from "./ScholarAsync";
import "./styles.css";

export default function App() {
  return (
    <LanguageProvider>
      <ScholarAsync />
    </LanguageProvider>
  );
}
