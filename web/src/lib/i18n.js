import { lang } from './store.js';

// [English, हिन्दी, मराठी] - hand-written drafts, to be approved by two reviewers in the Content studio
const D = {
  home: ['Home', 'होम', 'मुख्य'], quest: ['Quest', 'खेल', 'खेळ'], class: ['Class', 'कक्षा', 'वर्ग'], board: ['Board', 'बोर्ड', 'फलक'], more: ['More', 'और', 'आणखी'],
  bigger: ['Which is bigger, {a} or {b}?', 'कौन बड़ा है, {a} या {b}?', 'कोणता मोठा आहे, {a} की {b}?'],
  same: ['They are the same', 'दोनों बराबर हैं', 'दोन्ही समान आहेत'], cannot: ['Cannot tell', 'पता नहीं', 'सांगता येत नाही'],
  sure: ['I am sure', 'मुझे पक्का पता है', 'मला खात्री आहे'], guess: ['Just guessing', 'अंदाज़ा है', 'अंदाज आहे'],
  how: ['How sure are you?', 'कितना पक्का है?', 'किती खात्री आहे?'],
  start: ['Check my tower', 'मेरी मीनार जाँचो', 'माझा मनोरा तपासा'], again: ['Play again', 'फिर से खेलो', 'पुन्हा खेळा'],
  hi: ['Hi, I’m Eeta! Every idea in maths is a brick. Let’s see if your tower stands strong.', 'मैं ईटा हूँ! गणित का हर विचार एक ईंट है। चलो देखें, मीनार मज़बूत है या नहीं।', 'मी ईटा! गणितातली प्रत्येक कल्पना एक वीट आहे. चला, मनोरा भक्कम आहे का पाहू.'],
  noscore: ['No marks here. Say what you really think.', 'यहाँ अंक नहीं हैं। जो सच में सोचते हो, वही बताओ।', 'इथे गुण नाहीत. मनापासून जे वाटतं तेच सांग.'],
  found: ['Found it! This brick is loose.', 'मिल गई! यह ईंट ढीली है।', 'सापडली! ही वीट सैल आहे.'],
  solid: ['Your tower is solid!', 'तुम्हारी मीनार मज़बूत है!', 'तुझा मनोरा भक्कम आहे!'],
  fix: ['Fix this brick', 'यह ईंट ठीक करो', 'ही वीट दुरुस्त करा'],
  fixed: ['Brick fixed!', 'ईंट ठीक हो गई!', 'वीट दुरुस्त झाली!'],
  next: ['Next', 'आगे', 'पुढे'], done: ['Done', 'हो गया', 'झाले'],
  unsure: ['Eeta needs your teacher for this one. Tell them how you think!', 'इसके लिए ईटा को शिक्षक की मदद चाहिए।', 'यासाठी ईटाला शिक्षकांची मदत हवी.'],
  day3: ['Day 3 check', 'तीसरे दिन की जाँच', 'तिसऱ्या दिवसाची तपासणी'], day10: ['Day 10 check', 'दसवें दिन की जाँच', 'दहाव्या दिवसाची तपासणी'],
  open: ['Gap open', 'कमी बाकी', 'उणीव बाकी'], closing: ['Gap closing', 'कमी भर रही है', 'उणीव भरत आहे'], closed: ['Gap closed', 'कमी पूरी', 'उणीव भरली'],
  bricks: ['bricks', 'ईंटें', 'विटा'],
};
const IX = { en: 0, hi: 1, mr: 2 };
export function t(k, v) { let s = (D[k] || [k])[IX[lang.value]] ?? k; if (v) for (const x in v) s = s.replace(`{${x}}`, v[x]); return s; }
export const LANGS = [['en', 'English'], ['hi', 'हिन्दी'], ['mr', 'मराठी']];

// what Eeta says about each cause, in child language
export const KID = {
  TOPS_AND_BOTTOMS: ['You added the tops and the bottoms. But the bottom is the size of the piece. Sizes don’t get added!', 'तुमने ऊपर-ऊपर और नीचे-नीचे जोड़ा। पर नीचे का अंक टुकड़े का आकार है, वह जुड़ता नहीं!', 'तू वरचे आणि खालचे अंक मिळवलेस. पण खालचा अंक तुकड्याचा आकार सांगतो, तो मिळवत नाहीत!'],
  TOPS_ADD_BOTS_MULT: ['Good idea to match the bottoms! The tops must change with them, or the amount changes.', 'नीचे का अंक मिलाना अच्छा विचार है! पर ऊपर का अंक भी साथ बदलना होगा।', 'खालचे अंक जुळवणं छान! पण वरचा अंकही त्याबरोबर बदलायला हवा.'],
  MULTIPLY_INSTEAD: ['You found a part of a part. Here we want to put two parts together.', 'तुमने हिस्से का हिस्सा निकाला। यहाँ दो हिस्सों को जोड़ना है।', 'तू भागाचा भाग काढलास. इथे दोन भाग एकत्र करायचे आहेत.'],
  BIGGER_BOTTOM_BIGGER: ['A bigger bottom means more people sharing one roti. So each piece gets smaller!', 'नीचे बड़ा अंक यानी एक रोटी में ज़्यादा लोग। तो हर टुकड़ा छोटा!', 'खाली मोठा अंक म्हणजे एका भाकरीत जास्त जण. म्हणून प्रत्येक तुकडा लहान!'],
  ADDITIVE_EQUIV: ['You added the same number to top and bottom. To keep the amount, cut every piece equally: multiply.', 'तुमने ऊपर-नीचे एक ही संख्या जोड़ी। मात्रा वही रखने के लिए गुणा करो।', 'तू वर-खाली सारखीच संख्या मिळवलीस. प्रमाण तेच ठेवायला गुणाकार कर.'],
};
export const kid = (h) => KID[h]?.[IX[lang.value]] ?? '';
export const CONCEPT_T = {
  whole: ['Whole numbers', 'पूर्ण संख्याएँ', 'पूर्ण संख्या'], bottom: ['What the bottom counts', 'नीचे का अंक', 'खालचा अंक'], size: ['Fraction size', 'भिन्न का आकार', 'अपूर्णांकाचा आकार'],
  equiv: ['Equivalent fractions', 'तुल्य भिन्न', 'सममूल्य अपूर्णांक'], common: ['Common denominators', 'समान हर', 'समान छेद'], opsense: ['Add or multiply?', 'जोड़ या गुणा?', 'बेरीज की गुणाकार?'], addunlike: ['Fraction addition', 'भिन्नों का जोड़', 'अपूर्णांकांची बेरीज'], ratio: ['Ratio and proportion', 'अनुपात', 'गुणोत्तर'],
};
export const cname = (id) => CONCEPT_T[id]?.[IX[lang.value]] ?? id;

export const NOTE = {
  title: ['A note from {s}’s maths class', '{s} की गणित कक्षा से एक संदेश', '{s} च्या गणित वर्गाकडून एक निरोप'],
  strong: ['What is strong', 'क्या मज़बूत है', 'काय भक्कम आहे'], fixing: ['What we are fixing', 'हम क्या ठीक कर रहे हैं', 'आपण काय दुरुस्त करत आहोत'], home: ['5 minutes at home', 'घर पर 5 मिनट', 'घरी 5 मिनिटे'],
  foot: ['This is not a mark or a rank. It will change as your child learns.', 'यह न अंक है, न रैंक। बच्चा सीखेगा तो यह बदलेगा।', 'हा गुण किंवा क्रमांक नाही. मूल शिकेल तसा हा बदलेल.'],
  strongT: ['Comparing whole numbers and sharing things equally.', 'पूर्ण संख्याओं की तुलना और बराबर बाँटना।', 'पूर्ण संख्यांची तुलना आणि समान वाटणी.'],
  none: ['All checked foundations look secure.', 'जाँची गई सभी नींव मज़बूत लगती हैं।', 'तपासलेले सर्व पाया भक्कम दिसतात.'],
  act: {
    bottom: ['Fold one paper strip into 2 and another into 3. Ask: are these pieces the same size? Can we just count them together?', 'एक काग़ज़ की पट्टी को 2 में, दूसरी को 3 में मोड़ें। पूछें: क्या टुकड़े बराबर हैं? क्या इन्हें सीधे गिन सकते हैं?', 'एक कागदी पट्टी 2 भागांत, दुसरी 3 भागांत दुमडा. विचारा: तुकडे सारखे आहेत का? थेट मोजता येतील का?'],
    size: ['Share one roti between 2 people, then between 4. Ask: who gets the bigger piece, and why?', 'एक रोटी 2 लोगों में बाँटें, फिर 4 में। पूछें: किसका टुकड़ा बड़ा है और क्यों?', 'एक भाकरी 2 जणांत वाटा, मग 4 जणांत. विचारा: कोणाचा तुकडा मोठा आणि का?'],
    equiv: ['Cut half a roti into 2 equal pieces. Ask: did the amount change, or only the number of pieces?', 'आधी रोटी को 2 बराबर टुकड़ों में काटें। पूछें: मात्रा बदली या सिर्फ़ टुकड़े?', 'अर्ध्या भाकरीचे 2 समान तुकडे करा. विचारा: प्रमाण बदललं की फक्त तुकडे?'],
    common: ['Draw two equal bars. Cut one in 2, one in 3. Find one cut that fits both.', 'दो बराबर पट्टियाँ बनाएँ। एक को 2 में, एक को 3 में काटें। ऐसा काट खोजें जो दोनों में बैठे।', 'दोन समान पट्ट्या काढा. एक 2 भागांत, एक 3 भागांत. दोन्हींना जुळेल असा काप शोधा.'],
    opsense: ['Say two kitchen stories: “half a cup and a third of a cup” and “half of a third of a cup”. Which one puts together?', 'रसोई की दो बातें कहें: “आधा कप और तिहाई कप” तथा “तिहाई कप का आधा”। जोड़ किसमें है?', 'स्वयंपाकघरातल्या दोन गोष्टी सांगा: “अर्धा कप आणि एक तृतीयांश कप” व “एक तृतीयांश कपाचा अर्धा”. बेरीज कुठे?'],
  },
};
export const nt = (arr, v) => { let s = arr[IX[lang.value]]; if (v) for (const k in v) s = s.replace(`{${k}}`, v[k]); return s; };
