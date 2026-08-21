/**
 * The rarity table, computed from the contract across all 500 tokens.
 *
 * GENERATED. Do not edit by hand.
 *   pnpm hardhat run scripts/gen-rarity.ts
 *
 * Exact counts, not estimates from the weights. `test/specs/rarity.ts` fails
 * if the art changes and this is not regenerated.
 */

export const SUPPLY = 500;

export const LAYERS = ["Background","Fur","Pattern","Eyes","Eye shape","Mouth","Accessory"];

/** Every layer, its values, and how many of the supply carry each. Rarest first. */
export const RARITY = [
  {
    "layer": "Background",
    "values": [
      {
        "value": "Void",
        "count": 11,
        "percent": 2.1999999999999997
      },
      {
        "value": "Butter",
        "count": 53,
        "percent": 10.6
      },
      {
        "value": "Slate",
        "count": 55,
        "percent": 11
      },
      {
        "value": "Sky",
        "count": 62,
        "percent": 12.4
      },
      {
        "value": "Lilac",
        "count": 71,
        "percent": 14.2
      },
      {
        "value": "Sand",
        "count": 78,
        "percent": 15.6
      },
      {
        "value": "Mint",
        "count": 84,
        "percent": 16.8
      },
      {
        "value": "Blush",
        "count": 86,
        "percent": 17.2
      }
    ]
  },
  {
    "layer": "Fur",
    "values": [
      {
        "value": "Void",
        "count": 7,
        "percent": 1.4000000000000001
      },
      {
        "value": "Honey",
        "count": 40,
        "percent": 8
      },
      {
        "value": "Chocolate",
        "count": 54,
        "percent": 10.8
      },
      {
        "value": "Russian Blue",
        "count": 55,
        "percent": 11
      },
      {
        "value": "Cream",
        "count": 70,
        "percent": 14.000000000000002
      },
      {
        "value": "Marmalade",
        "count": 73,
        "percent": 14.6
      },
      {
        "value": "Grey",
        "count": 92,
        "percent": 18.4
      },
      {
        "value": "Ginger",
        "count": 109,
        "percent": 21.8
      }
    ]
  },
  {
    "layer": "Pattern",
    "values": [
      {
        "value": "Spotted",
        "count": 42,
        "percent": 8.4
      },
      {
        "value": "Tuxedo",
        "count": 67,
        "percent": 13.4
      },
      {
        "value": "Patch",
        "count": 71,
        "percent": 14.2
      },
      {
        "value": "Tabby",
        "count": 125,
        "percent": 25
      },
      {
        "value": "Solid",
        "count": 195,
        "percent": 39
      }
    ]
  },
  {
    "layer": "Eyes",
    "values": [
      {
        "value": "Heterochromia",
        "count": 17,
        "percent": 3.4000000000000004
      },
      {
        "value": "Violet",
        "count": 67,
        "percent": 13.4
      },
      {
        "value": "Copper",
        "count": 82,
        "percent": 16.400000000000002
      },
      {
        "value": "Amber",
        "count": 103,
        "percent": 20.599999999999998
      },
      {
        "value": "Blue",
        "count": 112,
        "percent": 22.400000000000002
      },
      {
        "value": "Green",
        "count": 119,
        "percent": 23.799999999999997
      }
    ]
  },
  {
    "layer": "Eye shape",
    "values": [
      {
        "value": "Laser",
        "count": 13,
        "percent": 2.6
      },
      {
        "value": "Wink",
        "count": 61,
        "percent": 12.2
      },
      {
        "value": "Wide",
        "count": 86,
        "percent": 17.2
      },
      {
        "value": "Sleepy",
        "count": 121,
        "percent": 24.2
      },
      {
        "value": "Round",
        "count": 219,
        "percent": 43.8
      }
    ]
  },
  {
    "layer": "Mouth",
    "values": [
      {
        "value": "Fangs",
        "count": 50,
        "percent": 10
      },
      {
        "value": "Blep",
        "count": 105,
        "percent": 21
      },
      {
        "value": "Neutral",
        "count": 144,
        "percent": 28.799999999999997
      },
      {
        "value": "Smile",
        "count": 201,
        "percent": 40.2
      }
    ]
  },
  {
    "layer": "Accessory",
    "values": [
      {
        "value": "Crown",
        "count": 12,
        "percent": 2.4
      },
      {
        "value": "Beanie",
        "count": 30,
        "percent": 6
      },
      {
        "value": "Sunglasses",
        "count": 41,
        "percent": 8.200000000000001
      },
      {
        "value": "Scarf",
        "count": 55,
        "percent": 11
      },
      {
        "value": "Bow",
        "count": 85,
        "percent": 17
      },
      {
        "value": "Collar",
        "count": 103,
        "percent": 20.599999999999998
      },
      {
        "value": "None",
        "count": 174,
        "percent": 34.8
      }
    ]
  }
];

/** Token id to its seven trait values, in LAYERS order. */
export const TOKEN_TRAITS = {"1":["Sky","Marmalade","Solid","Blue","Sleepy","Smile","Sunglasses"],"2":["Lilac","Cream","Solid","Violet","Sleepy","Fangs","Sunglasses"],"3":["Slate","Grey","Solid","Amber","Round","Neutral","None"],"4":["Butter","Chocolate","Tuxedo","Copper","Round","Neutral","Bow"],"5":["Blush","Russian Blue","Tabby","Amber","Wink","Fangs","Collar"],"6":["Blush","Grey","Spotted","Blue","Round","Blep","None"],"7":["Mint","Marmalade","Solid","Green","Round","Neutral","Bow"],"8":["Sand","Ginger","Tabby","Amber","Wide","Blep","Scarf"],"9":["Slate","Grey","Solid","Amber","Sleepy","Neutral","Collar"],"10":["Lilac","Russian Blue","Solid","Green","Round","Smile","None"],"11":["Slate","Cream","Solid","Amber","Round","Smile","None"],"12":["Mint","Ginger","Patch","Blue","Round","Neutral","Bow"],"13":["Mint","Chocolate","Solid","Copper","Round","Neutral","Scarf"],"14":["Butter","Grey","Tabby","Violet","Wink","Smile","Collar"],"15":["Lilac","Ginger","Tabby","Violet","Wink","Neutral","None"],"16":["Sky","Russian Blue","Tabby","Blue","Sleepy","Fangs","Collar"],"17":["Lilac","Honey","Spotted","Copper","Round","Neutral","Bow"],"18":["Blush","Marmalade","Tuxedo","Copper","Round","Blep","None"],"19":["Blush","Honey","Tabby","Green","Sleepy","Blep","None"],"20":["Butter","Russian Blue","Solid","Violet","Round","Neutral","Collar"],"21":["Sky","Cream","Solid","Amber","Sleepy","Smile","Bow"],"22":["Mint","Cream","Solid","Blue","Wink","Neutral","None"],"23":["Blush","Honey","Patch","Blue","Sleepy","Smile","Beanie"],"24":["Sky","Ginger","Patch","Green","Round","Neutral","None"],"25":["Butter","Marmalade","Tabby","Copper","Sleepy","Blep","None"],"26":["Lilac","Ginger","Solid","Green","Round","Blep","None"],"27":["Mint","Cream","Spotted","Blue","Round","Smile","Sunglasses"],"28":["Slate","Grey","Tuxedo","Copper","Sleepy","Neutral","None"],"29":["Slate","Cream","Solid","Amber","Round","Neutral","Collar"],"30":["Blush","Grey","Tuxedo","Amber","Sleepy","Smile","Scarf"],"31":["Mint","Marmalade","Solid","Green","Sleepy","Fangs","None"],"32":["Mint","Cream","Tabby","Blue","Round","Smile","None"],"33":["Mint","Marmalade","Solid","Copper","Wide","Blep","Bow"],"34":["Mint","Grey","Solid","Green","Wide","Smile","None"],"35":["Lilac","Chocolate","Solid","Green","Wide","Smile","Collar"],"36":["Mint","Chocolate","Solid","Blue","Sleepy","Blep","None"],"37":["Lilac","Honey","Tabby","Amber","Sleepy","Blep","Sunglasses"],"38":["Lilac","Ginger","Tabby","Copper","Sleepy","Smile","None"],"39":["Blush","Marmalade","Patch","Amber","Round","Smile","None"],"40":["Lilac","Chocolate","Solid","Amber","Round","Smile","Crown"],"41":["Lilac","Grey","Tabby","Green","Sleepy","Smile","Bow"],"42":["Blush","Honey","Solid","Copper","Wink","Blep","None"],"43":["Blush","Ginger","Spotted","Amber","Sleepy","Smile","Sunglasses"],"44":["Mint","Cream","Tuxedo","Blue","Round","Neutral","None"],"45":["Blush","Ginger","Tabby","Violet","Round","Blep","Beanie"],"46":["Mint","Chocolate","Solid","Blue","Round","Neutral","Collar"],"47":["Blush","Ginger","Tabby","Heterochromia","Wink","Blep","None"],"48":["Mint","Russian Blue","Solid","Green","Wide","Neutral","None"],"49":["Sky","Marmalade","Tabby","Green","Round","Smile","Collar"],"50":["Void","Marmalade","Tuxedo","Heterochromia","Wide","Smile","Collar"],"51":["Sand","Ginger","Solid","Blue","Wide","Neutral","None"],"52":["Butter","Void","Solid","Green","Wink","Smile","None"],"53":["Blush","Ginger","Spotted","Blue","Round","Neutral","Crown"],"54":["Mint","Chocolate","Solid","Blue","Round","Blep","Collar"],"55":["Slate","Ginger","Patch","Amber","Sleepy","Neutral","Collar"],"56":["Mint","Chocolate","Patch","Green","Wink","Smile","None"],"57":["Slate","Chocolate","Solid","Copper","Round","Blep","Bow"],"58":["Slate","Ginger","Spotted","Blue","Sleepy","Blep","None"],"59":["Mint","Marmalade","Tabby","Violet","Round","Smile","Bow"],"60":["Blush","Cream","Solid","Blue","Sleepy","Fangs","Crown"],"61":["Lilac","Ginger","Solid","Blue","Wink","Smile","None"],"62":["Blush","Grey","Solid","Green","Round","Smile","None"],"63":["Mint","Russian Blue","Tabby","Heterochromia","Round","Smile","Sunglasses"],"64":["Mint","Grey","Tuxedo","Green","Round","Neutral","None"],"65":["Mint","Grey","Solid","Amber","Round","Smile","Collar"],"66":["Sand","Grey","Tabby","Green","Round","Blep","Collar"],"67":["Sky","Marmalade","Patch","Amber","Sleepy","Fangs","None"],"68":["Blush","Grey","Tabby","Violet","Round","Smile","Beanie"],"69":["Butter","Ginger","Solid","Green","Round","Fangs","Bow"],"70":["Sand","Grey","Tabby","Green","Sleepy","Smile","Beanie"],"71":["Slate","Russian Blue","Patch","Blue","Round","Blep","Collar"],"72":["Butter","Marmalade","Tabby","Green","Round","Smile","Sunglasses"],"73":["Sky","Grey","Solid","Violet","Round","Fangs","None"],"74":["Sand","Ginger","Solid","Blue","Wink","Blep","None"],"75":["Sand","Ginger","Solid","Blue","Round","Smile","Scarf"],"76":["Sky","Ginger","Solid","Amber","Round","Smile","Collar"],"77":["Blush","Grey","Spotted","Blue","Sleepy","Blep","None"],"78":["Mint","Marmalade","Tabby","Blue","Round","Smile","Collar"],"79":["Sand","Grey","Solid","Violet","Sleepy","Neutral","Bow"],"80":["Sand","Ginger","Solid","Violet","Sleepy","Smile","Bow"],"81":["Sky","Ginger","Spotted","Violet","Sleepy","Fangs","Sunglasses"],"82":["Blush","Russian Blue","Solid","Blue","Wink","Smile","Scarf"],"83":["Butter","Chocolate","Spotted","Green","Round","Neutral","Bow"],"84":["Lilac","Chocolate","Spotted","Amber","Round","Fangs","Scarf"],"85":["Mint","Ginger","Patch","Amber","Round","Neutral","Bow"],"86":["Butter","Cream","Patch","Amber","Round","Smile","Collar"],"87":["Slate","Chocolate","Tabby","Copper","Wide","Smile","None"],"88":["Blush","Grey","Tabby","Amber","Wide","Smile","None"],"89":["Sand","Russian Blue","Tuxedo","Amber","Round","Neutral","None"],"90":["Sand","Honey","Tabby","Green","Round","Blep","None"],"91":["Sand","Grey","Tuxedo","Blue","Sleepy","Smile","Sunglasses"],"92":["Lilac","Marmalade","Patch","Green","Round","Smile","Bow"],"93":["Blush","Grey","Tabby","Amber","Round","Neutral","Collar"],"94":["Sand","Marmalade","Tabby","Amber","Wink","Blep","Bow"],"95":["Sky","Grey","Tuxedo","Blue","Round","Smile","None"],"96":["Void","Russian Blue","Tuxedo","Amber","Wide","Smile","Scarf"],"97":["Slate","Marmalade","Tabby","Violet","Round","Smile","Collar"],"98":["Sand","Grey","Solid","Blue","Round","Smile","None"],"99":["Mint","Marmalade","Patch","Green","Round","Blep","Bow"],"100":["Blush","Grey","Solid","Amber","Round","Neutral","None"],"101":["Slate","Grey","Solid","Amber","Wide","Neutral","None"],"102":["Lilac","Grey","Patch","Copper","Wink","Blep","Bow"],"103":["Mint","Chocolate","Solid","Copper","Wide","Fangs","None"],"104":["Mint","Cream","Spotted","Green","Round","Fangs","Scarf"],"105":["Butter","Cream","Tabby","Amber","Round","Smile","None"],"106":["Sand","Ginger","Patch","Copper","Laser","Smile","Scarf"],"107":["Mint","Grey","Solid","Green","Round","Neutral","Collar"],"108":["Sand","Russian Blue","Tuxedo","Violet","Wide","Neutral","Collar"],"109":["Lilac","Cream","Patch","Copper","Laser","Neutral","Beanie"],"110":["Slate","Ginger","Solid","Copper","Wide","Neutral","None"],"111":["Sky","Grey","Tabby","Blue","Round","Smile","Bow"],"112":["Lilac","Chocolate","Tabby","Green","Round","Blep","Scarf"],"113":["Lilac","Chocolate","Tabby","Green","Round","Neutral","None"],"114":["Mint","Grey","Patch","Copper","Round","Smile","Sunglasses"],"115":["Sand","Cream","Patch","Amber","Laser","Smile","Bow"],"116":["Mint","Grey","Tabby","Amber","Round","Blep","Collar"],"117":["Mint","Chocolate","Tabby","Violet","Wide","Fangs","None"],"118":["Blush","Russian Blue","Solid","Violet","Laser","Blep","Bow"],"119":["Butter","Ginger","Solid","Green","Round","Neutral","None"],"120":["Blush","Marmalade","Solid","Copper","Wink","Fangs","Sunglasses"],"121":["Lilac","Grey","Patch","Blue","Wide","Smile","None"],"122":["Slate","Ginger","Tabby","Copper","Sleepy","Neutral","Scarf"],"123":["Lilac","Russian Blue","Tabby","Amber","Round","Smile","Collar"],"124":["Sand","Cream","Tabby","Copper","Laser","Smile","Crown"],"125":["Mint","Chocolate","Solid","Amber","Laser","Blep","Collar"],"126":["Butter","Ginger","Solid","Copper","Round","Neutral","Crown"],"127":["Butter","Grey","Solid","Green","Round","Smile","Collar"],"128":["Butter","Russian Blue","Patch","Violet","Round","Blep","None"],"129":["Blush","Grey","Solid","Blue","Sleepy","Neutral","Bow"],"130":["Lilac","Marmalade","Tabby","Green","Wink","Smile","Scarf"],"131":["Sky","Honey","Tabby","Violet","Sleepy","Neutral","Bow"],"132":["Slate","Cream","Tuxedo","Amber","Round","Neutral","Beanie"],"133":["Void","Ginger","Solid","Violet","Round","Neutral","Collar"],"134":["Slate","Marmalade","Solid","Amber","Wide","Neutral","Sunglasses"],"135":["Mint","Cream","Solid","Copper","Wide","Smile","Scarf"],"136":["Blush","Void","Solid","Green","Wide","Smile","Collar"],"137":["Butter","Cream","Solid","Blue","Wink","Neutral","Collar"],"138":["Blush","Russian Blue","Solid","Green","Round","Neutral","Beanie"],"139":["Mint","Ginger","Solid","Violet","Round","Smile","Collar"],"140":["Butter","Honey","Spotted","Blue","Wide","Smile","Sunglasses"],"141":["Sand","Russian Blue","Patch","Blue","Sleepy","Neutral","None"],"142":["Butter","Ginger","Solid","Amber","Round","Neutral","Bow"],"143":["Sky","Marmalade","Tabby","Green","Round","Blep","Beanie"],"144":["Mint","Russian Blue","Tabby","Copper","Round","Neutral","None"],"145":["Lilac","Ginger","Patch","Blue","Sleepy","Blep","None"],"146":["Butter","Cream","Patch","Heterochromia","Laser","Neutral","None"],"147":["Butter","Russian Blue","Tabby","Amber","Sleepy","Neutral","None"],"148":["Sand","Ginger","Tabby","Heterochromia","Sleepy","Neutral","Sunglasses"],"149":["Blush","Marmalade","Patch","Amber","Round","Neutral","None"],"150":["Mint","Chocolate","Solid","Blue","Sleepy","Neutral","Collar"],"151":["Slate","Cream","Tabby","Blue","Wide","Fangs","Collar"],"152":["Slate","Ginger","Patch","Copper","Round","Neutral","None"],"153":["Sky","Cream","Solid","Green","Laser","Blep","Beanie"],"154":["Lilac","Ginger","Solid","Violet","Sleepy","Blep","Collar"],"155":["Lilac","Ginger","Tuxedo","Violet","Round","Blep","Scarf"],"156":["Sky","Honey","Solid","Green","Round","Blep","None"],"157":["Sky","Marmalade","Solid","Amber","Wink","Neutral","None"],"158":["Slate","Grey","Tabby","Amber","Round","Neutral","None"],"159":["Sand","Chocolate","Solid","Blue","Sleepy","Smile","None"],"160":["Blush","Ginger","Tabby","Copper","Round","Blep","None"],"161":["Lilac","Honey","Solid","Green","Wide","Smile","Collar"],"162":["Blush","Marmalade","Spotted","Green","Round","Smile","Bow"],"163":["Sand","Chocolate","Tuxedo","Blue","Wide","Fangs","Bow"],"164":["Lilac","Russian Blue","Tabby","Amber","Sleepy","Smile","Bow"],"165":["Sand","Chocolate","Tuxedo","Violet","Round","Fangs","Bow"],"166":["Lilac","Chocolate","Tuxedo","Blue","Round","Neutral","Beanie"],"167":["Sky","Ginger","Patch","Blue","Wide","Fangs","Bow"],"168":["Sky","Russian Blue","Patch","Green","Sleepy","Smile","Bow"],"169":["Blush","Ginger","Tabby","Violet","Wink","Neutral","None"],"170":["Mint","Honey","Tabby","Copper","Round","Neutral","Bow"],"171":["Blush","Cream","Solid","Heterochromia","Round","Smile","Collar"],"172":["Butter","Chocolate","Patch","Green","Sleepy","Neutral","None"],"173":["Mint","Grey","Solid","Blue","Sleepy","Smile","None"],"174":["Sand","Chocolate","Solid","Copper","Round","Smile","Collar"],"175":["Mint","Grey","Tuxedo","Blue","Wide","Smile","Collar"],"176":["Sand","Grey","Tabby","Violet","Wink","Neutral","Collar"],"177":["Butter","Honey","Tuxedo","Copper","Wide","Blep","Scarf"],"178":["Lilac","Ginger","Solid","Violet","Wink","Neutral","None"],"179":["Mint","Marmalade","Tuxedo","Blue","Round","Neutral","Collar"],"180":["Butter","Marmalade","Spotted","Blue","Sleepy","Neutral","None"],"181":["Mint","Cream","Solid","Blue","Round","Neutral","Crown"],"182":["Void","Marmalade","Tabby","Green","Wink","Blep","Bow"],"183":["Blush","Ginger","Solid","Blue","Round","Smile","Bow"],"184":["Void","Marmalade","Spotted","Green","Sleepy","Blep","Scarf"],"185":["Mint","Honey","Tabby","Blue","Wink","Smile","None"],"186":["Sand","Marmalade","Tabby","Blue","Wide","Smile","None"],"187":["Slate","Marmalade","Solid","Heterochromia","Round","Fangs","Bow"],"188":["Mint","Marmalade","Solid","Heterochromia","Round","Smile","Sunglasses"],"189":["Blush","Marmalade","Tuxedo","Copper","Wide","Blep","None"],"190":["Lilac","Grey","Tuxedo","Copper","Sleepy","Fangs","Beanie"],"191":["Mint","Russian Blue","Solid","Amber","Round","Neutral","Sunglasses"],"192":["Slate","Cream","Tabby","Blue","Sleepy","Blep","Bow"],"193":["Lilac","Chocolate","Solid","Amber","Round","Neutral","Bow"],"194":["Blush","Grey","Solid","Copper","Sleepy","Smile","Beanie"],"195":["Sand","Honey","Tuxedo","Green","Round","Smile","Bow"],"196":["Slate","Russian Blue","Tuxedo","Violet","Wide","Smile","Scarf"],"197":["Sky","Ginger","Patch","Green","Round","Blep","Scarf"],"198":["Mint","Honey","Tabby","Violet","Wink","Neutral","Beanie"],"199":["Slate","Ginger","Tabby","Green","Round","Smile","Collar"],"200":["Sky","Ginger","Solid","Amber","Round","Neutral","Collar"],"201":["Void","Marmalade","Tabby","Heterochromia","Round","Blep","Bow"],"202":["Butter","Marmalade","Solid","Blue","Round","Smile","None"],"203":["Mint","Grey","Tabby","Blue","Round","Blep","Collar"],"204":["Mint","Russian Blue","Solid","Blue","Round","Smile","None"],"205":["Lilac","Marmalade","Solid","Amber","Round","Neutral","Crown"],"206":["Sky","Chocolate","Solid","Amber","Wink","Smile","Crown"],"207":["Lilac","Chocolate","Solid","Violet","Sleepy","Blep","Sunglasses"],"208":["Sand","Ginger","Tabby","Green","Round","Smile","None"],"209":["Lilac","Cream","Patch","Blue","Sleepy","Blep","None"],"210":["Mint","Russian Blue","Tabby","Blue","Round","Smile","Bow"],"211":["Lilac","Grey","Patch","Violet","Sleepy","Smile","Scarf"],"212":["Slate","Grey","Tuxedo","Copper","Round","Smile","Scarf"],"213":["Mint","Grey","Tuxedo","Violet","Round","Smile","Beanie"],"214":["Slate","Cream","Patch","Green","Round","Smile","Collar"],"215":["Sand","Russian Blue","Patch","Blue","Laser","Neutral","None"],"216":["Sky","Grey","Spotted","Amber","Round","Neutral","Scarf"],"217":["Sand","Chocolate","Solid","Violet","Round","Blep","Beanie"],"218":["Butter","Ginger","Tabby","Blue","Wink","Fangs","None"],"219":["Slate","Chocolate","Spotted","Blue","Round","Neutral","Scarf"],"220":["Sand","Ginger","Spotted","Green","Wide","Neutral","None"],"221":["Lilac","Chocolate","Spotted","Violet","Sleepy","Smile","Scarf"],"222":["Lilac","Ginger","Tuxedo","Violet","Sleepy","Neutral","Collar"],"223":["Sand","Honey","Tuxedo","Blue","Round","Blep","Bow"],"224":["Sky","Russian Blue","Tuxedo","Green","Wink","Neutral","Collar"],"225":["Sand","Ginger","Spotted","Copper","Sleepy","Neutral","Sunglasses"],"226":["Mint","Russian Blue","Tabby","Amber","Sleepy","Smile","None"],"227":["Lilac","Grey","Patch","Blue","Round","Blep","Sunglasses"],"228":["Slate","Ginger","Solid","Amber","Round","Blep","None"],"229":["Mint","Marmalade","Solid","Green","Sleepy","Smile","Collar"],"230":["Sky","Ginger","Patch","Copper","Wide","Blep","Sunglasses"],"231":["Slate","Marmalade","Tabby","Green","Round","Neutral","None"],"232":["Sand","Cream","Patch","Amber","Round","Blep","Collar"],"233":["Mint","Grey","Patch","Copper","Round","Smile","Bow"],"234":["Lilac","Ginger","Solid","Heterochromia","Round","Neutral","Scarf"],"235":["Lilac","Marmalade","Patch","Amber","Sleepy","Smile","None"],"236":["Sky","Grey","Tabby","Copper","Round","Smile","Sunglasses"],"237":["Slate","Ginger","Tuxedo","Green","Wide","Neutral","Scarf"],"238":["Sky","Ginger","Solid","Green","Wide","Blep","None"],"239":["Sand","Marmalade","Spotted","Heterochromia","Round","Blep","Collar"],"240":["Sand","Ginger","Tuxedo","Violet","Wide","Neutral","Scarf"],"241":["Sky","Honey","Spotted","Amber","Round","Blep","Bow"],"242":["Lilac","Honey","Solid","Amber","Round","Neutral","Beanie"],"243":["Sand","Honey","Solid","Copper","Wide","Blep","None"],"244":["Sand","Ginger","Tabby","Blue","Round","Smile","None"],"245":["Blush","Ginger","Tabby","Blue","Round","Smile","None"],"246":["Sand","Ginger","Spotted","Blue","Wide","Smile","None"],"247":["Lilac","Grey","Spotted","Amber","Round","Smile","None"],"248":["Slate","Marmalade","Solid","Green","Round","Smile","Bow"],"249":["Butter","Cream","Tuxedo","Violet","Round","Neutral","None"],"250":["Lilac","Russian Blue","Solid","Amber","Round","Smile","None"],"251":["Mint","Marmalade","Solid","Copper","Sleepy","Blep","Bow"],"252":["Slate","Cream","Spotted","Blue","Round","Smile","Collar"],"253":["Lilac","Chocolate","Tabby","Copper","Sleepy","Smile","Bow"],"254":["Mint","Grey","Solid","Blue","Round","Blep","Sunglasses"],"255":["Sand","Honey","Solid","Green","Round","Blep","Collar"],"256":["Mint","Honey","Patch","Green","Sleepy","Smile","Bow"],"257":["Sky","Ginger","Solid","Green","Wink","Fangs","Scarf"],"258":["Butter","Marmalade","Solid","Green","Round","Blep","Bow"],"259":["Butter","Russian Blue","Patch","Copper","Wide","Blep","None"],"260":["Sand","Honey","Tabby","Blue","Round","Blep","Bow"],"261":["Sky","Russian Blue","Tuxedo","Violet","Sleepy","Smile","Scarf"],"262":["Sky","Russian Blue","Solid","Blue","Sleepy","Smile","Bow"],"263":["Blush","Grey","Solid","Green","Sleepy","Smile","Bow"],"264":["Lilac","Grey","Spotted","Copper","Round","Smile","None"],"265":["Void","Grey","Tabby","Heterochromia","Round","Smile","None"],"266":["Sky","Cream","Solid","Copper","Wide","Smile","Beanie"],"267":["Slate","Russian Blue","Tuxedo","Violet","Sleepy","Fangs","None"],"268":["Sand","Chocolate","Solid","Green","Round","Fangs","Bow"],"269":["Butter","Ginger","Solid","Violet","Sleepy","Smile","Scarf"],"270":["Blush","Ginger","Patch","Copper","Wide","Smile","Collar"],"271":["Mint","Grey","Tabby","Copper","Round","Neutral","None"],"272":["Sand","Cream","Tuxedo","Amber","Round","Blep","Scarf"],"273":["Sand","Grey","Tabby","Blue","Wide","Smile","Bow"],"274":["Sky","Marmalade","Solid","Green","Sleepy","Smile","Scarf"],"275":["Mint","Chocolate","Tabby","Violet","Round","Smile","Collar"],"276":["Sky","Ginger","Tabby","Copper","Round","Smile","None"],"277":["Blush","Honey","Tabby","Copper","Wink","Neutral","Collar"],"278":["Blush","Cream","Tabby","Green","Round","Blep","Scarf"],"279":["Slate","Chocolate","Tabby","Amber","Wink","Smile","None"],"280":["Lilac","Ginger","Solid","Blue","Sleepy","Smile","None"],"281":["Blush","Ginger","Tabby","Violet","Round","Smile","Sunglasses"],"282":["Blush","Cream","Solid","Amber","Sleepy","Smile","Collar"],"283":["Mint","Marmalade","Solid","Blue","Round","Neutral","None"],"284":["Mint","Grey","Solid","Blue","Sleepy","Blep","Beanie"],"285":["Slate","Ginger","Patch","Copper","Wide","Neutral","Scarf"],"286":["Sky","Cream","Tabby","Amber","Round","Smile","Collar"],"287":["Blush","Grey","Solid","Copper","Wink","Neutral","Collar"],"288":["Sky","Marmalade","Tabby","Blue","Wink","Smile","None"],"289":["Blush","Marmalade","Solid","Copper","Wide","Neutral","None"],"290":["Mint","Cream","Solid","Copper","Sleepy","Neutral","Collar"],"291":["Sand","Russian Blue","Solid","Amber","Round","Neutral","None"],"292":["Blush","Grey","Patch","Copper","Round","Smile","Sunglasses"],"293":["Mint","Marmalade","Tabby","Green","Round","Smile","None"],"294":["Mint","Chocolate","Solid","Amber","Round","Smile","None"],"295":["Slate","Cream","Tabby","Green","Round","Neutral","None"],"296":["Lilac","Grey","Tuxedo","Blue","Sleepy","Neutral","None"],"297":["Slate","Russian Blue","Solid","Green","Sleepy","Smile","Collar"],"298":["Sand","Honey","Tuxedo","Blue","Wide","Neutral","Scarf"],"299":["Lilac","Void","Tuxedo","Blue","Wink","Neutral","Bow"],"300":["Mint","Russian Blue","Solid","Violet","Wide","Smile","Beanie"],"301":["Sand","Ginger","Tuxedo","Amber","Sleepy","Smile","None"],"302":["Butter","Chocolate","Solid","Blue","Round","Smile","Beanie"],"303":["Sky","Grey","Spotted","Green","Round","Neutral","Collar"],"304":["Lilac","Cream","Tabby","Green","Wide","Smile","None"],"305":["Sand","Ginger","Solid","Copper","Sleepy","Smile","Beanie"],"306":["Blush","Chocolate","Tabby","Amber","Wink","Blep","Beanie"],"307":["Lilac","Grey","Tuxedo","Amber","Wink","Smile","Bow"],"308":["Lilac","Void","Solid","Blue","Round","Smile","Bow"],"309":["Slate","Cream","Tabby","Amber","Wink","Blep","Beanie"],"310":["Mint","Grey","Solid","Amber","Round","Fangs","Collar"],"311":["Sky","Russian Blue","Solid","Copper","Round","Fangs","None"],"312":["Butter","Russian Blue","Solid","Amber","Round","Smile","Collar"],"313":["Butter","Ginger","Solid","Blue","Wide","Fangs","Scarf"],"314":["Slate","Grey","Solid","Green","Round","Neutral","Scarf"],"315":["Void","Russian Blue","Patch","Green","Sleepy","Fangs","None"],"316":["Sky","Ginger","Solid","Violet","Round","Smile","None"],"317":["Lilac","Ginger","Solid","Amber","Sleepy","Neutral","Collar"],"318":["Lilac","Cream","Tuxedo","Amber","Round","Blep","Crown"],"319":["Blush","Ginger","Solid","Violet","Sleepy","Neutral","Sunglasses"],"320":["Lilac","Chocolate","Patch","Copper","Wide","Blep","Scarf"],"321":["Sand","Void","Tuxedo","Heterochromia","Round","Smile","Bow"],"322":["Sand","Ginger","Solid","Green","Sleepy","Smile","None"],"323":["Butter","Ginger","Patch","Green","Wide","Smile","None"],"324":["Blush","Ginger","Solid","Blue","Wide","Blep","None"],"325":["Sky","Chocolate","Solid","Amber","Round","Fangs","None"],"326":["Sand","Marmalade","Tabby","Amber","Sleepy","Neutral","Bow"],"327":["Blush","Ginger","Patch","Blue","Wink","Smile","Collar"],"328":["Sky","Grey","Solid","Violet","Round","Neutral","Collar"],"329":["Mint","Grey","Patch","Blue","Round","Fangs","None"],"330":["Blush","Chocolate","Solid","Green","Wide","Neutral","Collar"],"331":["Blush","Marmalade","Patch","Blue","Round","Smile","Collar"],"332":["Lilac","Ginger","Spotted","Violet","Wink","Blep","Bow"],"333":["Sand","Ginger","Solid","Blue","Round","Smile","Bow"],"334":["Sky","Grey","Spotted","Violet","Round","Fangs","Scarf"],"335":["Butter","Cream","Solid","Blue","Sleepy","Smile","None"],"336":["Void","Cream","Tabby","Violet","Wink","Blep","None"],"337":["Sky","Cream","Patch","Heterochromia","Wink","Neutral","Scarf"],"338":["Blush","Grey","Tuxedo","Violet","Sleepy","Neutral","Sunglasses"],"339":["Blush","Cream","Patch","Copper","Sleepy","Neutral","None"],"340":["Blush","Cream","Spotted","Green","Wide","Fangs","Bow"],"341":["Sand","Russian Blue","Solid","Green","Round","Fangs","Collar"],"342":["Blush","Ginger","Solid","Copper","Wide","Smile","Collar"],"343":["Sand","Marmalade","Solid","Copper","Sleepy","Neutral","None"],"344":["Slate","Russian Blue","Patch","Copper","Round","Neutral","None"],"345":["Sand","Russian Blue","Tabby","Copper","Sleepy","Fangs","Sunglasses"],"346":["Butter","Marmalade","Tabby","Copper","Sleepy","Neutral","None"],"347":["Sand","Russian Blue","Solid","Green","Wide","Smile","Sunglasses"],"348":["Blush","Ginger","Tabby","Amber","Wink","Blep","Collar"],"349":["Sand","Ginger","Solid","Blue","Round","Fangs","None"],"350":["Butter","Cream","Tabby","Violet","Round","Neutral","Collar"],"351":["Sand","Ginger","Solid","Amber","Sleepy","Neutral","Bow"],"352":["Lilac","Cream","Patch","Amber","Sleepy","Neutral","Collar"],"353":["Sand","Ginger","Tabby","Green","Wink","Blep","Sunglasses"],"354":["Slate","Grey","Patch","Green","Round","Smile","None"],"355":["Sky","Russian Blue","Tuxedo","Blue","Wide","Smile","Bow"],"356":["Sky","Cream","Tuxedo","Blue","Round","Blep","Sunglasses"],"357":["Blush","Marmalade","Tuxedo","Copper","Sleepy","Neutral","Sunglasses"],"358":["Sky","Cream","Solid","Blue","Round","Smile","Collar"],"359":["Blush","Marmalade","Tuxedo","Violet","Wide","Smile","Beanie"],"360":["Mint","Russian Blue","Patch","Green","Wink","Neutral","Sunglasses"],"361":["Mint","Russian Blue","Solid","Violet","Wide","Smile","None"],"362":["Blush","Ginger","Solid","Blue","Wide","Neutral","Bow"],"363":["Lilac","Ginger","Tuxedo","Blue","Round","Smile","Bow"],"364":["Mint","Ginger","Solid","Amber","Round","Smile","Collar"],"365":["Sky","Cream","Solid","Copper","Wink","Neutral","Collar"],"366":["Mint","Grey","Solid","Blue","Laser","Blep","Bow"],"367":["Blush","Ginger","Tabby","Green","Round","Fangs","Sunglasses"],"368":["Sand","Ginger","Patch","Heterochromia","Round","Smile","Sunglasses"],"369":["Blush","Cream","Spotted","Green","Round","Neutral","None"],"370":["Sand","Marmalade","Solid","Amber","Wink","Smile","Crown"],"371":["Lilac","Marmalade","Patch","Green","Round","Neutral","Bow"],"372":["Sand","Russian Blue","Spotted","Blue","Round","Smile","Collar"],"373":["Sand","Grey","Solid","Copper","Wide","Smile","Scarf"],"374":["Slate","Ginger","Spotted","Green","Round","Neutral","Collar"],"375":["Butter","Russian Blue","Solid","Green","Wide","Neutral","None"],"376":["Sky","Chocolate","Solid","Blue","Round","Neutral","None"],"377":["Sand","Grey","Tabby","Blue","Wide","Neutral","Scarf"],"378":["Lilac","Cream","Patch","Green","Sleepy","Neutral","None"],"379":["Butter","Grey","Solid","Copper","Wide","Blep","Scarf"],"380":["Sand","Grey","Solid","Amber","Sleepy","Smile","None"],"381":["Lilac","Ginger","Tuxedo","Blue","Wink","Fangs","None"],"382":["Mint","Cream","Spotted","Green","Round","Smile","Collar"],"383":["Blush","Marmalade","Solid","Blue","Wink","Blep","Beanie"],"384":["Blush","Grey","Tuxedo","Blue","Round","Smile","Collar"],"385":["Mint","Ginger","Tabby","Blue","Sleepy","Blep","Beanie"],"386":["Blush","Cream","Solid","Amber","Round","Neutral","None"],"387":["Sky","Honey","Solid","Amber","Sleepy","Smile","Scarf"],"388":["Mint","Cream","Spotted","Blue","Wide","Smile","None"],"389":["Blush","Honey","Tabby","Green","Wide","Smile","None"],"390":["Sand","Russian Blue","Tuxedo","Violet","Sleepy","Neutral","Sunglasses"],"391":["Sky","Grey","Patch","Green","Sleepy","Smile","Sunglasses"],"392":["Sand","Marmalade","Solid","Violet","Wide","Blep","Collar"],"393":["Lilac","Russian Blue","Tabby","Green","Wink","Neutral","Scarf"],"394":["Sand","Honey","Solid","Green","Wink","Neutral","None"],"395":["Void","Honey","Tabby","Blue","Sleepy","Neutral","Sunglasses"],"396":["Blush","Ginger","Patch","Copper","Sleepy","Smile","None"],"397":["Butter","Void","Solid","Amber","Wide","Blep","Bow"],"398":["Blush","Cream","Tuxedo","Violet","Round","Smile","None"],"399":["Blush","Marmalade","Solid","Green","Round","Blep","Collar"],"400":["Sand","Chocolate","Tabby","Green","Round","Smile","Collar"],"401":["Mint","Grey","Solid","Blue","Sleepy","Blep","Sunglasses"],"402":["Mint","Chocolate","Solid","Green","Sleepy","Blep","Crown"],"403":["Blush","Honey","Solid","Green","Sleepy","Smile","Beanie"],"404":["Sky","Marmalade","Solid","Blue","Round","Smile","Collar"],"405":["Slate","Ginger","Spotted","Amber","Wide","Smile","None"],"406":["Void","Ginger","Spotted","Green","Sleepy","Smile","None"],"407":["Blush","Honey","Tabby","Violet","Sleepy","Fangs","Scarf"],"408":["Sky","Grey","Patch","Amber","Wide","Blep","Collar"],"409":["Mint","Honey","Solid","Blue","Sleepy","Smile","Collar"],"410":["Sand","Cream","Patch","Copper","Wide","Smile","None"],"411":["Mint","Chocolate","Tabby","Green","Round","Smile","Scarf"],"412":["Slate","Ginger","Solid","Amber","Sleepy","Neutral","Beanie"],"413":["Blush","Grey","Solid","Amber","Round","Neutral","Collar"],"414":["Sky","Grey","Tabby","Copper","Sleepy","Blep","Sunglasses"],"415":["Slate","Grey","Solid","Violet","Wink","Neutral","Bow"],"416":["Lilac","Honey","Tabby","Green","Wink","Fangs","Bow"],"417":["Butter","Marmalade","Tuxedo","Green","Round","Neutral","Beanie"],"418":["Blush","Honey","Tabby","Green","Round","Smile","None"],"419":["Blush","Cream","Tabby","Green","Round","Neutral","Bow"],"420":["Lilac","Ginger","Tabby","Amber","Round","Blep","None"],"421":["Sand","Chocolate","Spotted","Violet","Wide","Neutral","None"],"422":["Blush","Honey","Tabby","Green","Round","Blep","None"],"423":["Blush","Marmalade","Tuxedo","Green","Sleepy","Neutral","Collar"],"424":["Sand","Russian Blue","Tabby","Green","Wink","Smile","Collar"],"425":["Butter","Marmalade","Tuxedo","Amber","Round","Fangs","Bow"],"426":["Sand","Marmalade","Tabby","Green","Round","Smile","Bow"],"427":["Sky","Cream","Solid","Green","Round","Blep","Collar"],"428":["Butter","Grey","Solid","Amber","Wink","Smile","Sunglasses"],"429":["Slate","Ginger","Tuxedo","Copper","Wide","Neutral","Scarf"],"430":["Lilac","Cream","Tabby","Violet","Round","Smile","Scarf"],"431":["Blush","Void","Tabby","Copper","Wide","Smile","None"],"432":["Sky","Ginger","Tabby","Blue","Round","Smile","Collar"],"433":["Sky","Ginger","Patch","Green","Sleepy","Blep","None"],"434":["Sand","Marmalade","Tuxedo","Amber","Sleepy","Blep","Bow"],"435":["Sand","Ginger","Tabby","Green","Wide","Neutral","None"],"436":["Mint","Honey","Tuxedo","Copper","Sleepy","Smile","None"],"437":["Blush","Grey","Spotted","Blue","Sleepy","Neutral","Bow"],"438":["Butter","Ginger","Tuxedo","Green","Round","Blep","None"],"439":["Lilac","Russian Blue","Tabby","Amber","Round","Smile","None"],"440":["Slate","Chocolate","Solid","Copper","Round","Smile","Collar"],"441":["Blush","Grey","Tuxedo","Amber","Wink","Blep","None"],"442":["Sky","Ginger","Solid","Violet","Round","Fangs","None"],"443":["Blush","Ginger","Tabby","Copper","Sleepy","Neutral","None"],"444":["Slate","Grey","Solid","Green","Wink","Blep","Bow"],"445":["Butter","Grey","Patch","Green","Round","Smile","None"],"446":["Butter","Cream","Solid","Blue","Laser","Smile","Collar"],"447":["Blush","Marmalade","Tabby","Copper","Wink","Smile","None"],"448":["Butter","Marmalade","Tuxedo","Amber","Round","Fangs","Collar"],"449":["Lilac","Grey","Tabby","Copper","Round","Smile","None"],"450":["Lilac","Chocolate","Tuxedo","Copper","Round","Smile","Crown"],"451":["Butter","Honey","Spotted","Violet","Wink","Smile","Bow"],"452":["Sky","Marmalade","Tuxedo","Blue","Wide","Smile","Sunglasses"],"453":["Sky","Chocolate","Tuxedo","Copper","Wide","Blep","None"],"454":["Mint","Ginger","Tabby","Green","Sleepy","Blep","Bow"],"455":["Blush","Russian Blue","Solid","Heterochromia","Sleepy","Smile","None"],"456":["Slate","Grey","Solid","Amber","Wide","Blep","None"],"457":["Lilac","Grey","Solid","Violet","Sleepy","Blep","Bow"],"458":["Sand","Ginger","Solid","Blue","Round","Neutral","Collar"],"459":["Mint","Honey","Solid","Amber","Wide","Blep","None"],"460":["Blush","Cream","Spotted","Green","Sleepy","Blep","Collar"],"461":["Blush","Cream","Tabby","Violet","Sleepy","Neutral","Bow"],"462":["Mint","Cream","Tabby","Amber","Wink","Smile","None"],"463":["Sky","Cream","Solid","Green","Round","Smile","None"],"464":["Mint","Russian Blue","Patch","Green","Sleepy","Neutral","Beanie"],"465":["Butter","Chocolate","Tabby","Amber","Sleepy","Smile","Scarf"],"466":["Slate","Chocolate","Solid","Amber","Round","Smile","None"],"467":["Lilac","Marmalade","Patch","Copper","Wide","Blep","Bow"],"468":["Lilac","Grey","Solid","Copper","Wide","Blep","Collar"],"469":["Slate","Ginger","Patch","Copper","Wink","Fangs","Collar"],"470":["Slate","Ginger","Patch","Copper","Sleepy","Smile","Collar"],"471":["Lilac","Cream","Tabby","Green","Wide","Neutral","None"],"472":["Blush","Ginger","Tabby","Copper","Round","Fangs","Scarf"],"473":["Butter","Cream","Tuxedo","Green","Wide","Smile","None"],"474":["Sand","Ginger","Solid","Green","Round","Neutral","Bow"],"475":["Butter","Chocolate","Tuxedo","Amber","Sleepy","Blep","None"],"476":["Slate","Russian Blue","Patch","Violet","Wink","Smile","Scarf"],"477":["Sand","Marmalade","Tabby","Blue","Sleepy","Smile","None"],"478":["Butter","Honey","Solid","Heterochromia","Wink","Smile","None"],"479":["Butter","Cream","Solid","Blue","Round","Neutral","Collar"],"480":["Butter","Russian Blue","Patch","Blue","Wide","Neutral","Bow"],"481":["Butter","Grey","Tabby","Amber","Sleepy","Blep","Collar"],"482":["Mint","Marmalade","Solid","Amber","Laser","Smile","Bow"],"483":["Blush","Cream","Tabby","Green","Round","Smile","Scarf"],"484":["Mint","Grey","Solid","Blue","Round","Blep","None"],"485":["Mint","Chocolate","Solid","Violet","Wink","Smile","None"],"486":["Blush","Chocolate","Solid","Amber","Round","Fangs","None"],"487":["Blush","Marmalade","Solid","Blue","Round","Smile","Collar"],"488":["Sky","Marmalade","Solid","Green","Laser","Blep","Scarf"],"489":["Sky","Cream","Solid","Violet","Sleepy","Fangs","Collar"],"490":["Slate","Ginger","Solid","Amber","Round","Fangs","Collar"],"491":["Mint","Grey","Solid","Green","Wide","Smile","Bow"],"492":["Sand","Cream","Patch","Amber","Round","Smile","None"],"493":["Blush","Grey","Tabby","Amber","Wide","Neutral","Scarf"],"494":["Lilac","Grey","Solid","Copper","Round","Smile","Scarf"],"495":["Lilac","Marmalade","Spotted","Violet","Wide","Smile","None"],"496":["Mint","Honey","Tuxedo","Amber","Wide","Fangs","None"],"497":["Sky","Honey","Solid","Blue","Wide","Smile","Bow"],"498":["Slate","Ginger","Patch","Green","Sleepy","Neutral","None"],"499":["Slate","Chocolate","Solid","Amber","Round","Fangs","None"],"500":["Mint","Ginger","Solid","Violet","Sleepy","Fangs","Collar"]};

/**
 * One token's trait values, in LAYERS order.
 *
 * The same signature `dog-rarity.js` exposes, so the collection page can load
 * either module and read it the same way. The dogs pack their tokens into
 * index strings because 5000 of them spelled out is 484 KB; the cats do not
 * need to and still answer the same question.
 */
export function traitsOf(id) {
  return TOKEN_TRAITS[String(id)] ?? null;
}

/** How rare one token's rarest trait is, as a percentage. Lower is rarer. */
export function rarestOf(id) {
  const traits = TOKEN_TRAITS[String(id)];
  if (!traits) return 100;

  return Math.min(
    ...traits.map((value, i) => {
      const found = RARITY[i].values.find((v) => v.value === value);
      return found ? found.percent : 100;
    }),
  );
}

/** The percentage of the supply sharing a given value of a given layer. */
export function percentOf(layerIndex, value) {
  const found = RARITY[layerIndex]?.values.find((v) => v.value === value);
  return found ? found.percent : 0;
}
