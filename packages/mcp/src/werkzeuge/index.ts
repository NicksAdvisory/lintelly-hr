/** Alle Werkzeuge von Lintelly HR, in der Reihenfolge, in der Claude und ChatGPT sie sehen. */
import type { Werkzeug } from "../werkzeug";
import { ABLAUF } from "./ablauf";
import { BRIEFE } from "./briefe";
import { FRISTEN } from "./fristen";
import { GELD } from "./geld";
import { KUENDIGUNG } from "./kuendigung";
import { LOHN } from "./lohn";
import { PFLICHTEN } from "./pflichten";
import { RECHT } from "./recht";
import { SCHREIBEN } from "./schreiben";
import { URLAUB } from "./urlaub";
import { VERTRAG } from "./vertrag";

export const WERKZEUGE: Werkzeug[] = [...ABLAUF, ...KUENDIGUNG, ...FRISTEN, ...LOHN, ...GELD, ...URLAUB, ...PFLICHTEN, ...BRIEFE, ...SCHREIBEN, ...VERTRAG, ...RECHT];
