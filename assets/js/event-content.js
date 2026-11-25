/* Original wording of the event pages. Staff can change it on the desk page (event-admin.html),
   which saves a copy in the database. This file is only used until something has been saved,
   and by the desk page's "Load original wording" button.
   In FAQ answers, {date}, {time} and {place} are filled in from the event details. */
window.EVENT_TERMS_VERSION = "v3-2026-11-26";
window.EVENT_DEFAULTS = {
  event: {
    dateLabel: "Saturday, Nov 28",
    chip: "Sat · Nov 28",
    time: "2:00 PM – 4:00 PM",
    place: "",
    note: "Collect all 3 stamps: café tour, hotel tour, clinic tour."
  },
  welcome: {
    title: "Thanks-Giving\nStamp Rally",
    lead: "Three stops. Three stamps. One lucky draw. Grab a coffee, tour a hotel, peek into a clinic, and film it all.",
    steps: [
      "Sign in so we know you're here",
      "Film a clip at each stop",
      "Show staff, get your stamp",
      "3 stamps = you're in the lucky draw"
    ],
    footer: "Stay cozy. See you by the fire."
  },
  prizes: {
    heading: "Lucky draw prizes",
    items: [
      "Chance to win FREE HOTEL VOUCHER worth ₩300,000 (x5 Vouchers)",
      "Chance to win FREE SKIN TREATMENT worth ₩650,000 (x5 Vouchers)"
    ],
    note: "Collect all 3 stamps to enter. Winners are picked at random and not everyone will win."
  },
  register: {
    title: "Who's joining us?",
    lead: "This is also your check-in for today."
  },
  tasksPage: {
    intro: "Film a clip at each stop, then check in with the onsite team.",
    handoff: "Show your clip or photo to a Vively team member. They'll enter the code."
  },
  tasks: [
    { title: "Café tour", instruction: "Film your clips here, then check in with onsite staff.", faq: [
      ["What should I film here?", "Any short clip or photo that shows you at the café: the drinks, the vibe, you enjoying it. Staff just need to see you were there."],
      ["Who do I show?", "Find a Vively team member at the café. Can't spot one? Ask at the welcome desk."] ] },
    { title: "Hotel tour", instruction: "Film your clips here, then check in with onsite staff.", faq: [
      ["Can I film anywhere in the hotel?", "Film where the tour takes you. Follow the hotel's and staff's rules, and skip any area staff say is off limits."],
      ["Who do I show?", "A Vively team member at the hotel stop. Ask at the welcome desk if you can't find one."] ] },
    { title: "Clinic tour", instruction: "Film your clips here, then check in with onsite staff.", faq: [
      ["Is filming okay at the clinic?", "Only where staff say it's okay. Please don't film other guests or patients, and respect any no-filming areas."],
      ["Who do I show?", "A Vively team member at the clinic stop. Ask at the welcome desk if you can't find one."] ] }
  ],
  done: {
    title: "All 3 stamps!\nYou're in.",
    lead: "Your name is on the lucky draw list. Keep this screen handy, staff may ask to see it."
  },
  faq: {
    welcome: [
      ["What is this?", "A stamp rally at the Vively Thanks-Giving event. Visit three stops (café, hotel, clinic), film a clip at each, and Vively staff stamp your passport. All 3 stamps puts you in the lucky draw."],
      ["When and where is it?", "{date}, {time}. Where: {place}."],
      ["Do I have to follow @vively.global?", "It's optional, but we'd love it. Tapping the button just opens our Instagram."],
      ["Does everyone win something?", "No. The lucky draw is random and not everyone will win. See the Terms & Conditions when you sign in."]
    ],
    register: [
      ["Why do you need my phone and Instagram?", "Your name, phone and Instagram check you in and let us contact you if you win. Only the Vively team sees them, and they're used for this event only."],
      ["What happens to my details afterwards?", "Vively deletes them after the event wraps up. Details are in the Terms & Conditions."],
      ["I typed something wrong.", "Ask a Vively team member at the welcome desk and they'll help."],
      ["I lost my place or switched phones.", "Sign in again with the same name, phone number and Instagram and you'll pick up where you left off."]
    ],
    tasks: [
      ["How do stamps work?", "Film your clip, tap Completed, and show it to a Vively team member. They enter a secret code and your stamp appears."],
      ["Can I do the stops in any order?", "No. Stops unlock one after another: café, then hotel, then clinic."],
      ["Can I enter the code myself?", "No. Only Vively staff know the codes. Guessing codes can get you disqualified."],
      ["My signal dropped. Did I lose my stamps?", "No. Your stamps are saved. Reload this page and you'll be right where you were."]
    ],
    done: [
      ["Am I guaranteed a prize?", "No. All 3 stamps gets you into the lucky draw, but winners are picked at random and not everyone will win."],
      ["How will I know if I won?", "Ask a Vively team member how winners will be announced. The team can also reach winners with the details you gave when you signed in."],
      ["What do I show staff?", "This screen with your entry number."],
      ["Can I share my clips?", "Yes! Post them and tag @vively.global. It's entirely up to you."]
    ]
  },
  /* The prize list above is added to the "Lucky draw" section automatically. */
  terms: [
    ["About this event", "The Vively Thanks-Giving Stamp Rally (the \"Event\") is run by Vively on Saturday, Nov 28. These terms apply to everyone who takes part."],
    ["Taking part", "You join by signing in on this page and agreeing to these terms. Vively staff may decline or end anyone's participation, for example if the Event is full or the rules below are broken."],
    ["How stamps work", "There are three stops: café, hotel and clinic. At each stop, show your clip or photo to a Vively team member. If they are satisfied, they enter a code and your stamp is recorded. Stops are completed in order. Vively staff decisions about stamps are final. Only staff may enter codes. Trying to guess codes, sharing codes, or showing clips that are not yours may lead to disqualification."],
    ["Lucky draw", "Everyone who collects all three stamps is entered into the lucky draw. Winners are chosen at random, and each person can win one prize at most. Completing the rally does not guarantee a prize, and not everyone will win. How winners are announced is decided by Vively. Prizes may change or be cancelled."],
    ["Filming", "Follow staff instructions and the rules of each venue. Do not film other guests or patients, and respect any no-filming areas. You are responsible for your own clips and for having permission to film what you film. Posting clips is optional."],
    ["Your information", "We collect your name, phone number and Instagram handle, plus the times you check in and receive stamps. We use them to check you in, record your progress, run the lucky draw and contact winners. Only the Vively team can see them. Vively does not sell them. Vively deletes them after the Event wraps up. Your phone's browser also stores a small token so the page remembers your progress."],
    ["Changes", "Vively may change, pause or cancel the Event or these terms, for example for safety or venue reasons. Updated terms will be shown to you at the Event."],
    ["Questions", "Ask any Vively team member at the welcome desk."]
  ]
};
