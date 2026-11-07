import {useEffect, useState} from "react";
import {continueRender, delayRender} from "remotion";
import {loadFont} from "@remotion/google-fonts/ArchivoBlack";

const {fontFamily, waitUntilDone} = loadFont("normal", {weights: ["400"], subsets: ["latin"]});
export const useFontsReady = () => fontFamily;
export const useFontGate = () => {
  const [ready, setReady] = useState(false);
  const [h] = useState(() => delayRender("label font"));
  useEffect(() => {
    waitUntilDone().then(() => document.fonts.load(`900 100px ${fontFamily}`)).then(() => {setReady(true); continueRender(h);});
  }, [h]);
  return ready;
};
