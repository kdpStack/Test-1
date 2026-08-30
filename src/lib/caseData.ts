/* --------------------------------------------------------------- */
/* Narrative engine data: themes, word pools, story templates       */
/* --------------------------------------------------------------- */

export type ThemeId = "manor" | "cruise" | "casino" | "theater" | "alpine" | "gallery";

export interface ThemeDef {
  id: ThemeId;
  name: string;
  setting: string;
  tagline: string;
  victims: { name: string; epithet: string }[];
  intros: string[]; // slots: {setting} {victim} {epithet} {time}
  times: string[];
}

export const THEMES: ThemeDef[] = [
  {
    id: "manor",
    name: "Blackwood Manor",
    setting: "Blackwood Manor",
    tagline: "A locked-room affair in the English countryside",
    victims: [
      { name: "Alistair Blackwood", epithet: "the saffron magnate" },
      { name: "Lady Constance Hale", epithet: "the retired opera diva" },
      { name: "Sir Humphrey Finch", epithet: "the disgraced cartographer" },
    ],
    intros: [
      "Rain hammered the roof of {setting} when {victim}, {epithet}, was found slumped over the dinner table at precisely {time}. The doors were bolted from within. Every guest had a reason to wish it so. Only the grid knows who dealt the final hand.",
      "At {time} the lights of {setting} flickered and died for exactly nine seconds. When they returned, {victim} — {epithet} — was gone for good. The constable is baffled. Your pencil will not be.",
    ],
    times: ["midnight", "a quarter past eleven", "the stroke of nine", "half past ten"],
  },
  {
    id: "cruise",
    name: "The SS Meridian",
    setting: "the SS Meridian",
    tagline: "Nine decks, two thousand souls, one killer",
    victims: [
      { name: "Captain Elias Thorn", epithet: "the unflappable captain" },
      { name: "Vivienne Marsh", epithet: "heiress to the Marsh shipping line" },
      { name: "Dr. Ambrose Quill", epithet: "the ship's enigmatic physician" },
    ],
    intros: [
      "Midway across the Atlantic, {victim}, {epithet}, was discovered on the promenade deck at {time} — the lifeboats all accounted for, the manifest all present, and yet one passenger too many with a motive. The sea keeps secrets. The grid does not.",
      "The foghorn sounded at {time}. By the time it faded, {victim} — {epithet} — had slipped beneath the silence of {setting}. No port, no police, no escape. Everyone aboard is a suspect until the numbers say otherwise.",
    ],
    times: ["the midnight watch", "the dinner bell", "the last dance", "four bells"],
  },
  {
    id: "casino",
    name: "The Gilded Ace",
    setting: "the Gilded Ace casino",
    tagline: "The house always wins — except tonight",
    victims: [
      { name: "Salvatore Bruno", epithet: "the house's biggest debtor" },
      { name: "Mimi LaFleur", epithet: "the headline chanteuse" },
      { name: "Monty Callahan", epithet: "the retired card sharp" },
    ],
    intros: [
      "The roulette wheel at {setting} had barely stopped when {victim}, {epithet}, collapsed beside table nine at {time}. The chips were still warm. The cameras saw everything and nothing. Somewhere under the neon, a killer is cashing out.",
      "At {time}, the band paused between numbers and {victim} — {epithet} — slumped into the velvet dark of {setting}. The pit boss locked the doors before the applause died. Everyone at the tables had something to hide.",
    ],
    times: ["the eleventh hour", "the high-roller rush", "last call", "the turn of the card"],
  },
  {
    id: "theater",
    name: "The Orpheum Stage",
    setting: "the Orpheum Theatre",
    tagline: "A final curtain no one rehearsed",
    victims: [
      { name: "Edwin Booth-Crane", epithet: "the temperamental leading man" },
      { name: "Cora Delacroix", epithet: "the midnight critic" },
      { name: "Percival Ash", epithet: "the playwright of one hit" },
    ],
    intros: [
      "Act III of {setting} ended with a scream that was not in the script. {victim}, {epithet}, fell beneath the stage lights at {time}, and the curtain came down on a very real corpse. The cast cannot leave. The understudies cannot lie. Solve the grid, name the player.",
      "Greasepaint and gunpowder — {setting} smelled of both at {time}, when {victim}, {epithet}, was found behind the painted backdrop. Every actor had an alibi rehearsed to perfection. Perfection, as you know, is suspicious.",
    ],
    times: ["the final curtain", "the interval", "opening night", "the second bell"],
  },
  {
    id: "alpine",
    name: "The Edelweiss Lodge",
    setting: "the Edelweiss Lodge",
    tagline: "Snowed in at ten thousand feet",
    victims: [
      { name: "Baron Otto von Reuss", epithet: "the avalanche survivor" },
      { name: "Greta Winterbourne", epithet: "the map-obsessed mountaineer" },
      { name: "Dr. Felix Sturm", epithet: "the glacier surgeon" },
    ],
    intros: [
      "The cable car to {setting} was cut at {time}, stranding eleven guests above the clouds. By morning, {victim}, {epithet}, lay still in the snow beside the east terrace. The storm erased every footprint but the ones in the grid.",
      "At {time} the avalanche sirens of {setting} sang a false alarm — and in the confusion, {victim}, {epithet}, met a very true end. The passes are sealed until spring. Justice, however, need not wait for the thaw.",
    ],
    times: ["first light", "the evening descent", "the whiteout", "the lantern hour"],
  },
  {
    id: "gallery",
    name: "The Vermilion Gallery",
    setting: "the Vermilion Gallery",
    tagline: "Every masterpiece hides a hand",
    victims: [
      { name: "Julian Frost", epithet: "the forger turned collector" },
      { name: "Odessa Blanche", epithet: "the auctioneer with cold eyes" },
      { name: "Hector Vane", epithet: "the restorer of stolen things" },
    ],
    intros: [
      "The varnish was still wet on the anonymous Vermeer at {setting} when {victim}, {epithet}, was found at {time} — posed, quite deliberately, like one of the exhibits. The alarm never sounded. The guest list never lied. The grid will testify.",
      "At {time} the lights of {setting} dimmed for the unveiling, and when they rose, {victim} — {epithet} — had become the evening's most talked-about acquisition. The doors were watched. The skylight was not. Find the hand behind the frame.",
    ],
    times: ["the private view", "the unveiling", "the auctioneer's gavel", "closing time"],
  },
];

/* Word pools — answer words must match the evidence group size (3, 4 or 5 letters). */
export const SUSPECT_NAMES: Record<3 | 4 | 5, string[]> = {
  3: ["IVY", "REX", "GUS", "BEA", "MAX", "KIT", "FAY", "JOY", "NED", "SAL"],
  4: ["NORA", "OTIS", "RITA", "HUGO", "MYRA", "ENID", "CARL", "JUNE", "VERA", "OMAR"],
  5: ["BASIL", "HAZEL", "EDGAR", "FLORA", "GILES", "MABEL", "CEDAR", "DORIS", "SILAS", "NADIA"],
};

export const TITLES = [
  "Colonel", "Duchess", "Professor", "Countess", "Reverend", "Captain",
  "Baroness", "Doctor", "Major", "Madame", "Magistrate", "Vicomte",
];

export const WEAPONS: Record<3 | 4 | 5, string[]> = {
  3: ["AXE", "ICE", "BOW", "GIN"],
  4: ["ROPE", "WIRE", "VASE", "PILL", "MACE", "CANE"],
  5: ["KNIFE", "SWORD", "VENOM", "RAZOR", "POKER"],
};

export const LOCATIONS: Record<3 | 4 | 5, string[]> = {
  3: ["DEN", "BAR", "SPA", "LAB"],
  4: ["HALL", "LOFT", "DOCK", "VAULT", "DECK", "PIER"],
  5: ["STUDY", "TOWER", "ATTIC", "SUITE", "CABIN", "ARENA", "OPERA"],
};

export const MOTIVES = [
  "a forged codicil to the will",
  "a gambling debt come due",
  "a stolen family signet",
  "a scandalous unsent letter",
  "a partnership dissolved in fury",
  "the missing ledger page",
  "a broken engagement announced at dinner",
  "an inheritance diverted at the last hour",
];

export const SUSPECT_FLAVORS = [
  "claims to have been in the conservatory",
  "owes the victim a small fortune",
  "was cut from the will at noon",
  "arrived with an unregistered umbrella",
  "has mud on their evening shoes",
  "swears the clock had stopped",
  "was seen arguing at dinner",
  "keeps a suspiciously calm dog",
  "left the room for 'precisely two minutes'",
  "burned a letter before the body was found",
];
