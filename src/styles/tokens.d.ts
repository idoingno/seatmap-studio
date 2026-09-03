export interface Tokens {
  colors: {
    accent: string;
    accentText: string;
    accentSoft: string;
    accentBorder: string;
    ink: string;
    textBody: string;
    canvas: string;
    panel: string;
    panelBorder: string;
    seatOccupied: string;
    seatEmpty: string;
    brass: string;
  };
  radius: {
    base: string;
    island: string;
  };
  shadow: {
    island: string;
  };
  overlay: {
    toolbar: number;
    floatPanel: number;
    modal: number;
    toast: number;
  };
  antdVars: Record<string, string>;
}

export const colors: Tokens["colors"];
export const radius: Tokens["radius"];
export const shadow: Tokens["shadow"];
export const overlay: Tokens["overlay"];
export const antdVars: Tokens["antdVars"];
