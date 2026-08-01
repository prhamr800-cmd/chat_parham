import React, { useState, useMemo, useEffect } from "react";
import { Search, Smile, Heart, Leaf, Coffee, Trophy, Car, Lightbulb, HelpCircle, Clock } from "lucide-react";
import { motion } from "motion/react";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose?: () => void;
}

interface EmojiItem {
  char: string;
  tags: string; // Persian and English terms for searching
}

interface EmojiCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  emojis: EmojiItem[];
}

// Comprehensive Emoji database matching standard sections with search keywords in English and Persian
const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: "smileys",
    name: "احساسات و شکلک‌ها",
    icon: <Smile className="w-4 h-4" />,
    emojis: [
      { char: "😀", tags: "smile happy grining laugh خنده خوشحال شاد" },
      { char: "😃", tags: "smile happy laugh خندان خوشحال" },
      { char: "😄", tags: "smile happy joy خنده شاد" },
      { char: "😁", tags: "smile grin دندان خوشحال شاد" },
      { char: "😆", tags: "smile laugh چشم بسته قهقهه" },
      { char: "😅", tags: "smile sweat cold عرق شرمندگی" },
      { char: "😂", tags: "laugh cry tear گریه خنده شدید اشک" },
      { char: "🤣", tags: "laugh roll floor قهقهه خنده" },
      { char: "😊", tags: "smile blush لپ گل انداخته شاد" },
      { char: "😇", tags: "angel innocent فرشته پاک بیگناه" },
      { char: "🙂", tags: "smile simple لبخند ملایم ساده" },
      { char: "🙃", tags: "upside down وارونه چپه" },
      { char: "😉", tags: "wink چشمک شوخی" },
      { char: "😌", tags: "relieved calm آرامش راحت" },
      { char: "😍", tags: "love heart eyes عاشق قلب چشم شاد" },
      { char: "🥰", tags: "love hearts face عاشق قلب دوست شاد" },
      { char: "😘", tags: "kiss love بوسه عشق محبت" },
      { char: "😋", tags: "delicious tongue yummy خوشمزه زبان" },
      { char: "😛", tags: "tongue شوخی زبان شکلک" },
      { char: "😜", tags: "tongue wink چشمک زبان شوخی" },
      { char: "🤪", tags: "crazy دیوانه خل بازی" },
      { char: "🤨", tags: "eyebrow suspicious مشکوک تعجب" },
      { char: "🧐", tags: "monocle intellectual دانشمند ذره بین" },
      { char: "🤓", tags: "nerd عینک خرخون باهوش" },
      { char: "😎", tags: "cool sunglasses عینک دودی خفن باحال" },
      { char: "🤩", tags: "star eyes هیجان زده ستاره چشم" },
      { char: "🥳", tags: "party celebration تولد جشن مهمانی" },
      { char: "😏", tags: "smirk نیشخند مغرور تمسخر" },
      { char: "😒", tags: "unamused بی حوصله ناراضی" },
      { char: "😞", tags: "disappointed ناامید غمگین" },
      { char: "😔", tags: "pensive sad غمگین افسرده" },
      { char: "😟", tags: "worried نگران دلواپس" },
      { char: "😕", tags: "confused گیج سردرگم" },
      { char: "🙁", tags: "frown sad ناراحت" },
      { char: "😣", tags: "persevere سختی کلافه" },
      { char: "😖", tags: "confounded داغون کلافه" },
      { char: "😫", tags: "tired خسته کلافه" },
      { char: "😩", tags: "weary خسته بی تاب" },
      { char: "🥺", tags: "pleading beg التماس خواهش مظلوم" },
      { char: "😢", tags: "cry sad tear گریه اشک ناراحت" },
      { char: "😭", tags: "cry sad loud گریه شدید زار اشک" },
      { char: "😤", tags: "triumph steam عصبانی غرور پف" },
      { char: "😠", tags: "angry عصبانی خشمگین" },
      { char: "😡", tags: "rage angry خشم شدید قرمز عصبانی" },
      { char: "🤬", tags: "swear cursing فحش ناسزا بی ادبی" },
      { char: "🤯", tags: "mind blown مغز انفجار تعجب شدید" },
      { char: "😳", tags: "flushed blush خجالت سرخ تعجب" },
      { char: "🥵", tags: "hot sweat گرما عطش قرمز" },
      { char: "🥶", tags: "cold freeze یخ سرما آبی" },
      { char: "😱", tags: "scream fear وحشت جیغ ترس" },
      { char: "😨", tags: "fear scare ترس نگران" },
      { char: "😰", tags: "anxious sweat استرس عرق نگران" },
      { char: "😥", tags: "sad relieved عرق سرد ناراحت" },
      { char: "😓", tags: "sweat ناراحت خسته" },
      { char: "🤗", tags: "hug آغوش بغل صمیمیت" },
      { char: "🤔", tags: "thinking تفکر فکر سوال" },
      { char: "🤭", tags: "shygiggle خنده خجالتی دست جلوی دهان" },
      { char: "🤫", tags: "shush quiet هیس ساکت سکوت" },
      { char: "🤥", tags: "liar nose دروغ دماغ پینوکیو" },
      { char: "😶", tags: "no mouth سکوت لال بی حرف" },
      { char: "😐", tags: "neutral بی تفاوت خنثی" },
      { char: "😑", tags: "expressionless بی احساس خسته" },
      { char: "😬", tags: "grimace کلافه دندان قفل" },
      { char: "🙄", tags: "roll eyes چشم غره تمسخر" },
      { char: "😯", tags: "hushed تعجب ملایم" },
      { char: "😦", tags: "frowning open mouth تعجب شوک" },
      { char: "😧", tags: "anguished ناراحت تعجب" },
      { char: "😮", tags: "surprise واویلا دهان باز" },
      { char: "😲", tags: "astonished شوک شگفت زده تعجب" },
      { char: "🥱", tags: "yawn خمیازه خسته" },
      { char: "😴", tags: "sleep خواب آلود" },
      { char: "🤤", tags: "drool آب دهان خوشمزه" },
      { char: "😪", tags: "sleepy خسته خواب آلود حباب" },
      { char: "😵", tags: "dizzy گیج منگ" },
      { char: "🤐", tags: "zipper mouth دهان بسته سکوت زیپ" },
      { char: "🥴", tags: "woozy مست گیج پاتیل" },
      { char: "🤢", tags: "nauseous تهوع حال به هم زن سبز" },
      { char: "🤮", tags: "vomit استفراغ" },
      { char: "🤧", tags: "sneeze عطسه سرماخوردگی" },
      { char: "😷", tags: "mask ماسک بیماری کرونا" },
      { char: "🤒", tags: "thermometer تب بیمار دماسنج" },
      { char: "🤕", tags: "bandage سر باند پیچی مصدوم" },
      { char: "money", tags: "rich پول مایه دار" },
      { char: "🤑", tags: "money mouth پولکی پول مایه دار" },
      { char: "🤠", tags: "cowboy گاوچران کلاه تگزاس" },
      { char: "😈", tags: "devil شيطان جن بدجنس بنفش" },
      { char: "👿", tags: "imp عصبانی بدجنس بنفش" },
      { char: "👹", tags: "ogre غول ماسک ژاپنی سرخ" },
      { char: "👺", tags: "goblin دماغ دراز سرخ جن" },
      { char: "🤡", tags: "clown دلقک سیرک مسخره" },
      { char: "💩", tags: "poop پی پی عن مدفوع قهوه ای" },
      { char: "👻", tags: "ghost روح روح مهربان سفید" },
      { char: "💀", tags: "skull جمجمه اسکلت مرگ" },
      { char: "☠️", tags: "crossbones دزدان دریایی مرگ خطر" },
      { char: "👽", tags: "alien موجود فضایی بیگانه" },
      { char: "👾", tags: "alien monster بازی کامپیوتری فضایی" },
      { char: "🤖", tags: "robot ربات آهن رباتی" },
      { char: "🎃", tags: "halloween کدو تنبل هالووین" }
    ]
  },
  {
    id: "people",
    name: "مردم و دست‌ها",
    icon: <Heart className="w-4 h-4 text-rose-500" />,
    emojis: [
      { char: "👋", tags: "wave hello bye سلام خداحافظ دست تکان دادن" },
      { char: "🤚", tags: "backhand دست پشت" },
      { char: "🖐️", tags: "hand open انگشت باز" },
      { char: "✋", tags: "hand high ۵ پنج دست ایست" },
      { char: "🖖", tags: "vulcan فضایی ولکان پیشتازان" },
      { char: "👌", tags: "ok عالی تایید بیست" },
      { char: "🤏", tags: "pinch ذره ای کم کوچک" },
      { char: "✌️", tags: "victory peace پیروزی صلح دو ۲" },
      { char: "🤞", tags: "crossed fingers آرزو موفقیت شانس" },
      { char: "🤟", tags: "love you دوست دارم عشق" },
      { char: "🤘", tags: "rock metal شاخ راک متال موسیقی" },
      { char: "🤙", tags: "call me زنگ بزن تماس تلفن" },
      { char: "👈", tags: "point left اشاره چپ" },
      { char: "👉", tags: "point right اشاره راست" },
      { char: "👆", tags: "point up اشاره بالا" },
      { char: "🖕", tags: "middle finger فاک بی ادبی زشت" },
      { char: "👇", tags: "point down اشاره پایین" },
      { char: "☝️", tags: "point up ۱ یک اشاره" },
      { char: "👍", tags: "thumbs up like پسندیدم لایک تایید خوب" },
      { char: "👎", tags: "thumbs down dislike نپسندیدم دیس لایک بد" },
      { char: "✊", tags: "fist مشت قدرت ایستادگی" },
      { char: "👊", tags: "fist punch مشت ضربه بزن قدش" },
      { char: "🤛", tags: "fist left مشت چپ" },
      { char: "🤜", tags: "fist right مشت راست" },
      { char: "👏", tags: "clap تشویق دست زدن عالی" },
      { char: "🙌", tags: "celebrate هورا دست بالا هیجان" },
      { char: "👐", tags: "open hands دست باز" },
      { char: "🤲", tags: "palms up دعا دست ها باز" },
      { char: "🤝", tags: "handshake دست دادن توافق قرارداد" },
      { char: "🙏", tags: "pray thank you خواهش التماس تشکر شکرگزاری" },
      { char: "✍️", tags: "write نوشتن قلم دست نویس" },
      { char: "💅", tags: "nails لاک ناخن زیبایی آرایش" },
      { char: "🤳", tags: "selfie سلفی عکس" },
      { char: "💪", tags: "muscle biceps بازو قدرت قوی ورزش" },
      { char: "🦾", tags: "robotic arm بازو رباتیک" },
      { char: "🦵", tags: "leg پا ورزش دویدن" },
      { char: "🦶", tags: "foot پا قدم" },
      { char: "👂", tags: "ear گوش شنیدن" },
      { char: "👃", tags: "nose دماغ بینی بو کشیدن" },
      { char: "🧠", tags: "brain مغز هوش تفکر" },
      { char: "🦷", tags: "tooth دندان دندانپزشکی" },
      { char: "👀", tags: "eyes چشم ها نگاه تماشا مشکوک" },
      { char: "👁️", tags: "eye چشم نگاه تکی تک چشمی" },
      { char: "👅", tags: "tongue زبان" },
      { char: "👄", tags: "mouth لب دهان" },
      { char: "💋", tags: "kiss لب بوسه رژ لب قرمز" },
      { char: "🩸", tags: "blood drop خون اهدا جراحت" },
      { char: "👤", tags: "silhouette آدم کاربر پروفایل شخص" },
      { char: "👥", tags: "profiles کاربران گروه اعضا اجتماع" },
      { char: "🧒", tags: "child کودک بچه" },
      { char: "👦", tags: "boy پسر" },
      { char: "👧", tags: "girl دختر" },
      { char: "🧑", tags: "person فرد انسان" },
      { char: "👨", tags: "man مرد" },
      { char: "👩", tags: "woman زن" },
      { char: "👴", tags: "old man پیرمرد پدربزرگ" },
      { char: "👵", tags: "old woman پیرزن مادربزرگ" },
      { char: "👸", tags: "princess شاهزاده دختر ملکه زیبا" },
      { char: "🤴", tags: "prince شاهزاده پسر تاج" },
      { char: "🦸", tags: "superhero قهرمان سوپرمن" },
      { char: "🦹", tags: "villain شرور بدجنس" },
      { char: "👼", tags: "angel بچه فرشته" },
      { char: "🎅", tags: "santa نوئل کریسمس بابانوئل" },
      { char: "🤶", tags: "mrs claus زن کریسمس" },
      { char: "🧙", tags: "mage جادوگر هری پاتر" },
      { char: "🧚", tags: "fairy پری رویایی" },
      { char: "🧛", tags: "vampire دراکولا خون آشام" },
      { char: "🧜", tags: "mermaid پری دریایی" },
      { char: "🧝", tags: "elf الف افسانه‌ای" },
      { char: "🧞", tags: "genie غول چراغ جادو جن" },
      { char: "🧟", tags: "zombie زامبی مرده متحرک" },
      { char: "🧗", tags: "climbing صخره نوردی ورزش کوه" },
      { char: "🧘", tags: "yoga مدیتیشن آرامش تمرکز یوگا" },
      { char: "🛌", tags: "bed خواب تختخواب استراحت" }
    ]
  },
  {
    id: "nature",
    name: "حیوانات و طبیعت",
    icon: <Leaf className="w-4 h-4 text-emerald-500" />,
    emojis: [
      { char: "🐶", tags: "dog doggy سگ هاپو وفادار" },
      { char: "🐱", tags: "cat kitty گربه پیشی ملوس" },
      { char: "🐭", tags: "mouse موش" },
      { char: "🐹", tags: "hamster همستر موش خانگی" },
      { char: "🐰", tags: "rabbit خرگوش" },
      { char: "🦊", tags: "fox روباه مکار" },
      { char: "🐻", tags: "bear خرس" },
      { char: "🐼", tags: "panda پاندا تنبل" },
      { char: "🐨", tags: "koala کوالا استرالیا" },
      { char: "🐯", tags: "tiger ببر وحشی" },
      { char: "🦁", tags: "lion شیر جنگل سلطان" },
      { char: "🐮", tags: "cow گاو" },
      { char: "🐷", tags: "pig خنزیر خوک" },
      { char: "🐽", tags: "pig nose دماغ خوک" },
      { char: "🐸", tags: "frog قورباغه وزغ" },
      { char: "🐵", tags: "monkey میمون بوزینه" },
      { char: "🙈", tags: "monkey blind چشم بسته ندیدم" },
      { char: "🙉", tags: "monkey deaf گوش بسته نشنیدم" },
      { char: "🙊", tags: "monkey mute دهان بسته نگفتم" },
      { char: "🐒", tags: "monkey میمون کامل" },
      { char: "🐔", tags: "chicken مرغ" },
      { char: "🐧", tags: "penguin پنگوئن قطب" },
      { char: "🐦", tags: "bird پرنده" },
      { char: "🐤", tags: "chick جوجه زرد" },
      { char: "🐣", tags: "chick egg جوجه در حال خروج تخم" },
      { char: "🐥", tags: "chick جوجه ناز" },
      { char: "🦆", tags: "duck اردک" },
      { char: "🦅", tags: "eagle عقاب شاهین" },
      { char: "🦉", tags: "owl جغد دانا شب" },
      { char: "🐺", tags: "wolf گرگ" },
      { char: "🦄", tags: "unicorn تک شاخ رویایی صورتی" },
      { char: "🐝", tags: "bee عسل زنبور نیش" },
      { char: "🐛", tags: "caterpillar کرم حشره پیله" },
      { char: "🦋", tags: "butterfly پروانه زیبا" },
      { char: "🐌", tags: "snail حلزون تنبل" },
      { char: "🐞", tags: "ladybug کفشدوزک قرمز" },
      { char: "🐜", tags: "ant مورچه تلاش" },
      { char: "🕷️", tags: "spider عنکبوت رتیل" },
      { char: "🕸️", tags: "web تار عنکبوت" },
      { char: "🦂", tags: "scorpion عقرب پاییز" },
      { char: "🐢", tags: "turtle لاک پشت تنبل" },
      { char: "🐍", tags: "snake مار افعی زهر" },
      { char: "🦎", tags: "lizard مارمولک" },
      { char: "🐙", tags: "octopus هشت پا اختاپوس" },
      { char: "🦑", tags: "squid ماهی مرکب" },
      { char: "🐬", tags: "dolphin دلفین باهوش" },
      { char: "🐳", tags: "whale نهنگ وال" },
      { char: "🦈", tags: "shark کوسه خطرناک" },
      { char: "🐊", tags: "crocodile تمساح کروکودیل" },
      { char: "🦓", tags: "zebra گورخر" },
      { char: "🦍", tags: "gorilla گوریل بزرگ" },
      { char: "🐘", tags: "elephant فیل خرطوم بزرگ" },
      { char: "🐫", tags: "camel شتر کویر" },
      { char: "giraffe", tags: "giraffe زرافه گردن دراز" },
      { char: "🐈", tags: "cat گربه ایستاده" },
      { char: "🐕", tags: "dog سگ وفادار کامل" },
      { char: "🕊️", tags: "dove peace کبوتر صلح سفید" },
      { char: "🐉", tags: "dragon اژدها افسانه" },
      { char: "🌵", tags: "cactus کاکتوس کویر" },
      { char: "🎄", tags: "christmas کریسمس درخت کاج" },
      { char: "🌲", tags: "evergreen کاج جنگل درخت" },
      { char: "🌳", tags: "tree درخت سرسبز" },
      { char: "🌱", tags: "seedling جوانه گیاه امید" },
      { char: "☘️", tags: "shamrock شبدر" },
      { char: "🍀", tags: "clover شبدر چهاربرگ شانس" },
      { char: "🍁", tags: "maple برگ افرا پاییز سرخ" },
      { char: "🍂", tags: "fallen leaves برگ ریزان پاییز زرد" },
      { char: "🍃", tags: "leaf wind باد برگ سبز" },
      { char: "🍄", tags: "mushroom قارچ" },
      { char: "🌸", tags: "cherry blossom شکوفه گیلاس صورتی بهار" },
      { char: "🌹", tags: "rose گل سرخ رز عشق محبت" },
      { char: "🌺", tags: "hibiscus گل ختمی صورتی" },
      { char: "🌻", tags: "sunflower آفتابگردان زرد" },
      { char: "🌼", tags: "blossom بابونه زرد" },
      { char: "🌷", tags: "tulip لاله سرخ" }
    ]
  },
  {
    id: "food",
    name: "غذا و نوشیدنی",
    icon: <Coffee className="w-4 h-4 text-amber-600" />,
    emojis: [
      { char: "🍏", tags: "apple green سیب سبز سلامت" },
      { char: "🍎", tags: "apple red سیب سرخ" },
      { char: "🍊", tags: "orange tangerin پرتقال مرکبات نارنجی" },
      { char: "🍋", tags: "lemon لیمو ترش زرد" },
      { char: "🍌", tags: "banana موز زرد" },
      { char: "🍉", tags: "watermelon هندوانه یلدا سرخ" },
      { char: "🍇", tags: "grapes انگور" },
      { char: "🍓", tags: "strawberry توت فرنگی سرخ" },
      { char: "🍒", tags: "cherries گیلاس آلبالو دوقلو" },
      { char: "🍑", tags: "peach هلو پوست" },
      { char: "🍍", tags: "pineapple آناناس" },
      { char: "🥥", tags: "coconut نارگیل" },
      { char: "🥝", tags: "kiwi کیوی" },
      { char: "🍅", tags: "tomato گوجه فرنگی سرخ" },
      { char: "🥑", tags: "avocado آووکادو چربی مفید" },
      { char: "🥦", tags: "broccoli کلم بروکلی سبز" },
      { char: "🥬", tags: "salad کاهو سبزی" },
      { char: "🥒", tags: "cucumber خیار سبز" },
      { char: "🌶️", tags: "pepper chili فلفل تند سرخ هلال" },
      { char: "🌽", tags: "corn ذرت بلال" },
      { char: "🥕", tags: "carrot هویج خرگوش زرد" },
      { char: "🥔", tags: "potato سیب زمینی" },
      { char: "🥐", tags: "croissant کروسان صبحانه نان" },
      { char: "🥯", tags: "bagel نان شیرینی" },
      { char: "🍞", tags: "bread toast نان تست صبحانه" },
      { char: "🥖", tags: "baguette نان فرانسوی باگت" },
      { char: "🥨", tags: "pretzel چوب شور شیرینی" },
      { char: "🥞", tags: "pancakes پنکیک صبحانه عسل" },
      { char: "🧀", tags: "cheese پنیر جری زرد" },
      { char: "🍖", tags: "meat استخوان گوشت تام وجری" },
      { char: "🍗", tags: "drumstick ران مرغ سوخاری غذا" },
      { char: "🥩", tags: "steak استیک گوشت قرمز" },
      { char: "bacon", tags: "bacon ژامبون بیکن" },
      { char: "🍔", tags: "hamburger برگر فست فود چاق کننده" },
      { char: "🍟", tags: "fries سیب زمینی سرخ کرده فست فود" },
      { char: "🍕", tags: "pizza پیتزا فست فود پنیر کش دار" },
      { char: "🌭", tags: "hotdog هات داگ ساندویچ" },
      { char: "🥪", tags: "sandwich ساندویچ تست" },
      { char: "🌮", tags: "taco تاکو مکزیکی" },
      { char: "🥚", tags: "egg تخم مرغ" },
      { char: "🍳", tags: "egg fry نیمرو ماهیتابه صبحانه" },
      { char: "🍲", tags: "soup سوپ غذا گرم کاسه" },
      { char: "🥗", tags: "salad سالاد رژیم سبزیجات" },
      { char: "🍿", tags: "popcorn پاپ کورن سینما پف فیل" },
      { char: "🧈", tags: "butter کره" },
      { char: "🍩", tags: "donut دونات شکلاتی شیرین" },
      { char: "🍪", tags: "cookie کوکی بیسکوئیت کاکائو" },
      { char: "🎂", tags: "cake birthday کیک تولد شمع جشن" },
      { char: "🍰", tags: "cake slice کیک خامه ای شیرینی" },
      { char: "🍫", tags: "chocolate شکلات کاکائویی تخته ای" },
      { char: "🍬", tags: "candy آبنبات شکلات" },
      { char: "🍭", tags: "lollipop آبنبات چوبی شیرین" },
      { char: "🍮", tags: "pudding کارامل پودینگ" },
      { char: "🍯", tags: "honey عسل زنبور کوزه" },
      { char: "🥛", tags: "milk شیر لیوان کلسیم" },
      { char: "☕", tags: "coffee tea قهوه چای داغ کافئین صبح" },
      { char: "🍵", tags: "matcha چای سبز کاسه" },
      { char: "🍶", tags: "sake نوشیدنی چینی کاسه" },
      { char: "🍾", tags: "champagne شامپاین جشن عروسی گازدار" },
      { char: "🍷", tags: "wine شراب انگور سرخ جام" },
      { char: "🍸", tags: "cocktail کوکتل جام مهمانی" },
      { char: "🍹", tags: "tropical آبمیوه نی دار ساحل" },
      { char: "🍺", tags: "beer آبجو ماءالشعیر لیوان کف" },
      { char: "🍻", tags: "beers سلامتی نوشیدنی لیوان ها جفت" },
      { char: "🥂", tags: "cheers جام های جفت سلامتی تبریک" },
      { char: "🥃", tags: "whiskey ویسکی لیوان سنگین" },
      { char: "🥤", tags: "soda نوشابه لیوان نی دار گازدار" },
      { char: "🧉", tags: "mate ماته نوشیدنی سنتی" },
      { char: "🧊", tags: "ice یخ سرما مکعب" }
    ]
  },
  {
    id: "activities",
    name: "ورزش و سرگرمی",
    icon: <Trophy className="w-4 h-4 text-yellow-500" />,
    emojis: [
      { char: "⚽", tags: "soccer football فوتبال توپ ورزش جام" },
      { char: "🏀", tags: "basketball بسکتبال توپ نارنجی" },
      { char: "🏈", tags: "football american راگبی توپ خربزه ای" },
      { char: "⚾", tags: "baseball بیسبال توپ سفید" },
      { char: "🥎", tags: "softball سافت بال زرد" },
      { char: " tennis", tags: "tennis تنیس راکت توپ" },
      { char: "🏐", tags: "volleyball والیبال توپ تور" },
      { char: "🏉", tags: "rugby راگبی" },
      { char: "🎱", tags: "billiards بیلیارد توپ هشت مشکی" },
      { char: "🏓", tags: "ping pong پینگ پنگ راکت" },
      { char: "🏸", tags: "badminton بدمینتون توپ پردار" },
      { char: "🏏", tags: "cricket کریکت" },
      { char: "⛳", tags: "golf گلف پرچم سوراخ" },
      { char: "🏹", tags: "archery تیر و کمان نشانه" },
      { char: "🎣", tags: "fishing ماهیگیری قلاب تفریح" },
      { char: "🥊", tags: "boxing دستکش بوکس مبارزه" },
      { char: "martial", tags: "martial karate کاراته تکواندو لباس سفید جودو" },
      { char: "🥅", tags: "goal دروازه تور" },
      { char: "🎯", tags: "bullseye دارت هدف گیری نشانه مرکز" },
      { char: "skateboard", tags: "skateboard اسکیت بورد تفریح چرخ" },
      { char: "🎿", tags: "ski چوب اسکی برف" },
      { char: "🏋️", tags: "weight lifter وزنه برداری وزنه آهن" },
      { char: "🤸", tags: "cartwheel ژیمناستیک ملق حرکتی" },
      { char: "⛹️", tags: "dribble دریبل بسکتبالیست" },
      { char: "🤺", tags: "fencing شمشیربازی" },
      { char: "🤾", tags: "handball هندبال" },
      { char: "🏌️", tags: "golfer گلف باز" },
      { char: "🏇", tags: "horse racing سوارکاری اسب مسابقه" },
      { char: "🧘", tags: "yoga یوگا مدیتیشن تمرکز" },
      { char: "🏄", tags: "surf موج سواری دریا ورزش" },
      { char: "🏊", tags: "swim شنا استخر آب ورزش" },
      { char: "🤽", tags: "water polo واترپولو" },
      { char: "🚣", tags: "rowing قایقرانی پارو پاروزن" },
      { char: "🚴", tags: "bike دوچرخه سواری دوچرخه ورزش" },
      { char: "🏆", tags: "trophy جام قهرمانی مدال کاپ طلا اول" },
      { char: "🥇", tags: "medal gold مدال طلا اول رتبه" },
      { char: "🥈", tags: "medal silver مدال نقره دوم" },
      { char: "🥉", tags: "medal bronze مدال برنز سوم" },
      { char: "🎖️", tags: "military مدال نظامی ارتش شجاعت" },
      { char: "🎗️", tags: "ribbon روبان مناسبتی" },
      { char: "🎫", tags: "ticket بلیط سینما تئاتر" },
      { char: "🎟️", tags: "tickets بلیط ها ورود" },
      { char: "🎪", tags: "circus سیرک چادر راه راه" },
      { char: "🎭", tags: "theater تئاتر نقاب ماسک هنر بازیگری" },
      { char: "🎨", tags: "art palette پالت رنگ نقاشی هنرمند آبرنگ" },
      { char: "🎬", tags: "clapperboard سینما فیلمبرداری کلکتور هالیوود" },
      { char: "🎤", tags: "mic خوانندگی آواز میکروفون رپ موسیقی" },
      { char: "🎧", tags: "headphones هدفون موزیک موسیقی آهنگ گوش کردن" },
      { char: "🎼", tags: "music نوت موسیقی آهنگ ملودی" },
      { char: "🎹", tags: "piano پیانو کیبورد شستی موسیقی" },
      { char: "🥁", tags: "drum طبل درام ضرب کوبه ای" },
      { char: "🎷", tags: "sax ساکسیفون جاز موسیقی" },
      { char: "🎺", tags: "trumpet شیپور ترومپت موسیقی" },
      { char: "🎸", tags: "guitar گیتار سیم پاپ موسیقی برقی" },
      { char: "🎻", tags: "violin ویولن آرشه موسیقی سنتی" },
      { char: "🎲", tags: "dice تاس تخته نرد بازی سرگرمی" },
      { char: "🧩", tags: "puzzle پازل معماری قطعه" },
      { char: "♟️", tags: "pawn شطرنج مهره سرباز بازی فکری" },
      { char: "🎳", tags: "bowling بولینگ پین توپ چرخ" },
      { char: "gamepad", tags: "controller بازی کامپیوتری گیم پس بازی کنسول" },
      { char: "🎮", tags: "gamepad بازی دسته آتاری سگا پلی استیشن" },
      { char: "🎰", tags: "slot machine شانس قمار کازینو" }
    ]
  },
  {
    id: "travel",
    name: "سفر و مکان‌ها",
    icon: <Car className="w-4 h-4 text-sky-400" />,
    emojis: [
      { char: "🚗", tags: "car خودرو ماشین قرمز" },
      { char: "🚕", tags: "taxi تاکسی زرد مسافر" },
      { char: "🚙", tags: "suv شاسی بلند ماشین آبی" },
      { char: "🚌", tags: "bus اتوبوس حمل و نقل" },
      { char: "🚎", tags: "trolleybus اتوبوس برقی" },
      { char: "🏎️", tags: "racing car فرمول یک مسابقه سرعت ماشین" },
      { char: "🚓", tags: "police car ماشین پلیس آژیر" },
      { char: "🚑", tags: "ambulance آمبولانس بیمارستان اورژانس" },
      { char: "🚒", tags: "fire engine آتش نشانی ماشین اطفاء حریق" },
      { char: "🚐", tags: "van ون ماشین مسافرتی" },
      { char: "🚚", tags: "truck کامیون باربری" },
      { char: "🚛", tags: "semi کامیون بزرگ ترانزیت" },
      { char: "🚜", tags: "tractor تراکتور کشاورزی" },
      { char: "🛵", tags: "scooter موتور گازی پیک" },
      { char: "🚲", tags: "bicycle دوچرخه" },
      { char: "🛴", tags: "scooter اسکوتر بچه پا" },
      { char: "⚓", tags: "anchor لنگر کشتی دریا بنادر" },
      { char: "⛵", tags: "sailboat قایق بادبانی" },
      { char: "🛥️", tags: "motorboat قایق موتوری لوکس" },
      { char: "🛳️", tags: "passenger ship کشتی مسافربری کروز تفریحی" },
      { char: "🚢", tags: "ship کشتی بزرگ اقیانوس پیما باربری" },
      { char: "✈️", tags: "plane هواپیما پرواز فرودگاه سفر آسمان" },
      { char: "🛫", tags: "takeoff تیک آف بلند شدن پرواز" },
      { char: "🛬", tags: "landing فرود نشینی نشستن هواپیما" },
      { char: "🪂", tags: "parachute چتر نجات سقوط آزاد آسمان" },
      { char: "helicopter", tags: "helicopter بالگرد هلیکوپتر نظامی" },
      { char: "🚀", tags: "rocket موشک فضایی پرتاب ناسا" },
      { char: "🛸", tags: "ufo بشقاب پرنده فضایی ها" },
      { char: "⏰", tags: "alarm ساعت زنگ دار کوکی بیدار باش" },
      { char: "🧭", tags: "compass قطب نما جهت یابی سفر" },
      { char: "🏔️", tags: "snowy mountain کوه برفی دماوند زمستان" },
      { char: "⛰️", tags: "mountain کوه صخره قله" },
      { char: "🗻", tags: "fuji کوه فوجی ژاپن" },
      { char: "🏕️", tags: "camping کمپ چادر طبیعت گردی" },
      { char: "🏖️", tags: "beach ساحل آفتابی چتر دریا آبگرم" },
      { char: "🏜️", tags: "desert کویر بیابان خشک شن لوت" },
      { char: "🏝️", tags: "island جزیره درخت نخل آب اقیانوس" },
      { char: "🏞️", tags: "park پارک ملی رودخانه طبیعت سرسبز" },
      { char: "🏟️", tags: "stadium ورزشگاه استادیوم آزادی فوتبال" },
      { char: "🏛️", tags: "classical بنای تاریخی یونان ستون موزه دانشگاه" },
      { char: "🏗️", tags: "construction جرثقیل ساختمان سازی کارگاه" },
      { char: "🧱", tags: "brick آجر دیوارهای بتنی" },
      { char: "🏘️", tags: "houses محله خانه ها شهرک" },
      { char: "🏚️", tags: "ruin خراب مخروبه متروکه" },
      { char: "🏠", tags: "house خانه مسکن سقف زندگی" },
      { char: "🏡", tags: "house garden خانه ویلایی حیاط دار" },
      { char: "🏢", tags: "office آپارتمان اداری برج" },
      { char: " Hospital", tags: "hospital بیمارستان درمانگاه صلیب سرخ" },
      { char: "🏦", tags: "bank بانک پول خزانه" },
      { char: "🏨", tags: "hotel هتل اقامت مسافر لوکس" },
      { char: "🏪", tags: "convenience سوپر مارکت فروشگاه شبانه روزی" },
      { char: "🏫", tags: "school مدرسه دانش آموز کلاس تخته سیاه" },
      { char: "🏭", tags: "factory کارخانه صنعت آلودگی دودکش" },
      { char: "🏰", tags: "castle قلعه دیزنی شاهزاده قرون وسطی" },
      { char: " wedding", tags: "wedding عروسی کلیسا پیوند" },
      { char: "🗼", tags: "tokyo tower برج توکیو ایفل قرمز" },
      { char: "🗽", tags: "statue liberty مجسمه آزادی آمریکا نیویورک" },
      { char: "🕌", tags: "mosque مسجد اسلام گنبد مناره مسلمان" },
      { char: "⛪", tags: "church کلیسا مسیح صلیب ناقوس" },
      { char: "🏙️", tags: "cityscape شهر شلوغ برج ها" },
      { char: "🌃", tags: "night شب آسمان پر ستاره شهر تیره" },
      { char: "🌄", tags: "sunrise طلوع خورشید پشت کوه" },
      { char: "🌅", tags: "sunset غروب آفتاب افق دریا" },
      { char: "🌆", tags: "dusk غروب شهر آسمان نارنجی" },
      { char: "🌇", tags: "sunset غروب خورشید بین برج ها" },
      { char: "🌉", tags: "bridge پل بزرگ شب چراغانی" },
      { char: "🎡", tags: "ferris wheel چرخ و فلک شهربازی هیجان" },
      { char: "🎢", tags: "roller coaster ترن هوایی شهربازی آدرنالین" },
      { char: "💈", tags: "barber سلمانی آرایشگاه مردانه سه رنگ" },
      { char: "⛺", tags: "tent چادر مسافرتی" }
    ]
  },
  {
    id: "objects",
    name: "اشیاء و وسایل",
    icon: <Lightbulb className="w-4 h-4 text-yellow-400" />,
    emojis: [
      { char: "💻", tags: "laptop کامپیوتر لپ تاپ تکنولوژی ویندوز مک" },
      { char: "🖥️", tags: "desktop مانیتور نمایشگر کامپیوتر بزرگ" },
      { char: "🖨️", tags: "printer پرینتر چاپ کاغذ دفتر" },
      { char: "🖱️", tags: "mouse موس کامپیوتر چرخ کلیک" },
      { char: "💾", tags: "floppy فلاپی دیسک قدیمی ذخیره" },
      { char: "💿", tags: "cd سیدی دیسک موسیقی نرم افزار" },
      { char: "📷", tags: "camera دوربین عکاسی عکس خاطره" },
      { char: "📸", tags: "camera flash دوربین فلاش عکاس" },
      { char: "📹", tags: "video دوربین فیلمبرداری ویدیو ضبط" },
      { char: "🎥", tags: "movie سینما فیلم آپارات اکران" },
      { char: "📽️", tags: "projector پروژکتور سینمایی ارائه" },
      { char: "📞", tags: "phone تلفن تماس زنگ گوشی سبز" },
      { char: "☎️", tags: "telephone تلفن رومیزی قرمز کلاسیک" },
      { char: "📟", tags: "pager پیجر قدیمی پیام" },
      { char: "📠", tags: "fax فکس دورنگار دستگاه" },
      { char: "📺", tags: "tv تلویزیون نمایش فیلم" },
      { char: "📻", tags: "radio رادیو موج موزیک قدیمی" },
      { char: "🎙️", tags: "studio mic میکروفون استودیو پادکست ضبط" },
      { char: "🔋", tags: "battery باتری شارژ برق انرژی" },
      { char: "🔌", tags: "plug دوشاخه برق پریز سیم اتصالات" },
      { char: "💡", tags: "bulb لامپ ایده فکر روشنایی برق زرد" },
      { char: "flashlight", tags: "flashlight چراغ قوه تاریکی نور" },
      { char: "🕯️", tags: "candle شمع روشنایی شاعرانه تاریک" },
      { char: "💸", tags: "money wings پول بالدار پرواز مایه باد" },
      { char: "💵", tags: "dollar دلار اسکناس پول سبز مایه دار" },
      { char: "🪙", tags: "coin سکه طلا مایه" },
      { char: "💰", tags: "money bag کیسه پول دلار ثروت طلا گنج" },
      { char: "💳", tags: "credit card کارت اعتباری بانکی عابربانک پوز" },
      { char: "💎", tags: "gem diamond الماس گرانبها جواهر زیبایی درخشان" },
      { char: "⚖️", tags: "balance ترازو عدالت قانون دادگاه قضاوت" },
      { char: "🔧", tags: "wrench آچار فرانسه تعمیر ابزار کار" },
      { char: "🔨", tags: "hammer چکش کوبیدن میخ ابزار" },
      { char: "⚒️", tags: "pickaxe پتک معدن ابزار" },
      { char: "🛠️", tags: "tools ابزارآلات تعمیرات پیچ گوشتی آچار" },
      { char: "🔩", tags: "nut bolt پیچ و مهره اتصال ابزار" },
      { char: "⚙️", tags: "gear چرخ دنده تنظیمات سیستم مهندسی کارخانه" },
      { char: "⛓️", tags: "chains زنجیر اسارت اتصال محکم" },
      { char: "🧲", tags: "magnet آهنربا جذب کشش" },
      { char: "🔫", tags: "gun تفنگ هفت تیر آب پاش سبز شلیک" },
      { char: "💣", tags: "bomb بمب انفجار ترور خطر سیاه فتنه" },
      { char: "🧨", tags: "firecracker ترقه چهارشنبه سوری انفجار قرمز" },
      { char: "🪓", tags: "axe تبر هیزم جنگل چوب بری" },
      { char: "knife", tags: "knife چاقو کارد آشپزخانه تیز برنده" },
      { char: "🛡️", tags: "shield سپر محافظ دفاع امنیت جنگ" },
      { char: "🔮", tags: "crystal ball گوی بلورین پیشگویی جادو آینده" },
      { char: "🔬", tags: "microscope میکروسکوپ آزمایشگاه علم زیست سلول" },
      { char: "🔭", tags: "telescope تلسکوپ ستاره شناسی رصدخانه فضا آسمان" },
      { char: "🧪", tags: "test tube لوله آزمایش شیمی علوم رنگارنگ" },
      { char: "💉", tags: "syringe آمپول واکسن پزشک تزریق کرونا" },
      { char: "💊", tags: "pill قرص کپسول دارو بیمار شفا درمان" },
      { char: "🚪", tags: "door در ورود خروج چوب اتاق" },
      { char: "🔑", tags: "key کلید قفل رمز ورود حلال مشکلات" },
      { char: "🗝️", tags: "old key کلید قدیمی گنج قفل" },
      { char: "🎁", tags: "gift box کادو هدیه جعبه روبان تفریح جشن" },
      { char: "🎈", tags: "balloon بادکنک قرمز جشن تولد هلیومی" },
      { char: "🎀", tags: "ribbon پاپیون صورتی کادو دکوراسیون" },
      { char: "✉️", tags: "envelope نامه پاکت پست ایمیل پیام" },
      { char: "📩", tags: "incoming mail پاکت نامه دریافتی ایمیل صندوق" },
      { char: "📧", tags: "email پست الکترونیک پیام اینترنت" },
      { char: "💌", tags: "love letter نامه عاشقانه قلب بوسه مهر" },
      { char: "📦", tags: "package بسته پستی کارتن ارسال دیجی کالا" },
      { char: "📚", tags: "books کتاب ها مطالعه علم کتابخانه" },
      { char: "📖", tags: "open book کتاب باز قرآن مطالعه درس" },
      { char: "💼", tags: "briefcase کیف کار اداری مهندس چرم سامسونت" }
    ]
  },
  {
    id: "symbols",
    name: "نمادها و پرچم‌ها",
    icon: <HelpCircle className="w-4 h-4 text-purple-400" />,
    emojis: [
      { char: "❤️", tags: "love red heart قلب سرخ عشق صمیمیت محبت دوست" },
      { char: "🧡", tags: "heart orange قلب نارنجی مهر" },
      { char: "💛", tags: "heart yellow قلب زرد دوستی" },
      { char: "💚", tags: "heart green قلب سبز طبیعت" },
      { char: "💙", tags: "heart blue قلب آبی آرامش" },
      { char: "💜", tags: "heart purple قلب بنفش احترام" },
      { char: "🖤", tags: "heart black قلب مشکی تسلیت عزا تاریک" },
      { char: "🤍", tags: "heart white قلب سفید صلح پاکی" },
      { char: "🤎", tags: "heart brown قلب قهوه ای خاک" },
      { char: "💔", tags: "broken heart قلب شکسته شکست عشقی ناراحت غمگین" },
      { char: "❣️", tags: "heart exclamation علامت تعجب قلبی سرخ" },
      { char: "💕", tags: "two hearts قلب های جفت صورتی عشق" },
      { char: "💞", tags: "revolving hearts قلب های گردان عشق" },
      { char: "💓", tags: "beating heart ضربان قلب تپش زنده" },
      { char: "💗", tags: "growing heart قلب در حال بزرگ شدن" },
      { char: "💖", tags: "sparkle heart قلب درخشان طلایی ستاره" },
      { char: "💘", tags: "arrow heart تیر عشق کمان کوپید تیر خورده" },
      { char: "💝", tags: "heart ribbon قلب کادو روبان" },
      { char: "💟", tags: "heart decoration دکوراسیون قلبی بنفش" },
      { char: "☮️", tags: "peace صلح نشان نشان بین المللی" },
      { char: "✝️", tags: "cross صلیب مسیحیت ایمان" },
      { char: "☪️", tags: "star crescent هلال ماه و ستاره اسلام مسلمان" },
      { char: "☯️", tags: "yin yang یین و یانگ تعادل چین" },
      { char: "🕉️", tags: "om هندوئیسم نشان" },
      { char: "☸️", tags: "buddhism بودیسم چرخ هشت پر" },
      { char: "✡️", tags: "star david ستاره داوود یهودیت اسرائیل" },
      { char: "🕎", tags: "menorah شمعدان یهودی حنوکا" },
      { char: "🛐", tags: "place worship عبادتگاه نماز دعا" },
      { char: "♈", tags: "aries فروردین قوچ برج حمل" },
      { char: "♉", tags: "taurus اردیبهشت گاو برج ثور" },
      { char: "♊", tags: "gemini خرداد دوپیکر جوزا" },
      { char: "♋", tags: "cancer تیر خرچنگ سرطان" },
      { char: "♌", tags: "leo مرداد شیر اسد" },
      { char: "♍", tags: "virgo شهریور سنبله دوشیزه" },
      { char: "♎", tags: "libra مهر ترازو میزان" },
      { char: "♏", tags: "scorpio آبان عقرب" },
      { char: "♐", tags: "sagittarius آذر کماندار قوس" },
      { char: "♑", tags: "capricorn دی جدی بزغاله" },
      { char: "♒", tags: "aquarius بهمن دلو" },
      { char: "♓", tags: "pisces اسفند حوت ماهی ها" },
      { char: "☢️", tags: "radioactive رادیواکتیو هسته ای خطر زرد" },
      { char: "☣️", tags: "biohazard زیستی خطر میکروبی نارنجی" },
      { char: "⚠️", tags: "warning هشدار خطر مثلث زرد احتیاط" },
      { char: "⚡", tags: "lightning رعد و برق برق ولتاژ بالا زرد توفان" },
      { char: "🔥", tags: "fire شعله آتش گرما داغ جذاب ترند" },
      { char: "💧", tags: "water drop قطره آب باران تمیزی" },
      { char: "🌊", tags: "wave موج دریا اقیانوس طوفان آب" },
      { char: "🏁", tags: "checkered flag پرچم شطرنجی مسابقه پایان خط" },
      { char: "🚩", tags: "red flag پرچم سرخ خطر هشدار نشانه" },
      { char: "🎌", tags: "crossed flags پرچم های متقاطع ژاپن" },
      { char: "🏴", tags: "black flag پرچم مشکی دزدان دریایی" },
      { char: "🏳️", tags: "white flag پرچم سفید تسلیم صلح" },
      { char: "🏳️‍🌈", tags: "rainbow flag پرچم رنگین کمان" },
      { char: "🇮🇷", tags: "iran flag پرچم ایران وطن ميهن" },
      { char: "🇺🇸", tags: "usa flag پرچم آمریکا" },
      { char: "🇬🇧", tags: "uk flag پرچم انگلیس بریتانیا" },
      { char: "🇩🇪", tags: "germany flag پرچم آلمان" },
      { char: "🇫🇷", tags: "france flag پرچم فرانسه" },
      { char: "🇯🇵", tags: "japan flag پرچم ژاپن" },
      { char: "🇨🇳", tags: "china flag پرچم چین" },
      { char: "🇷🇺", tags: "russia flag پرچم روسیه" },
      { char: "🇮🇹", tags: "italy flag پرچم ایتالیا" },
      { char: "🇪🇸", tags: "spain flag پرچم اسپانیا" },
      { char: "🇨🇦", tags: "canada flag پرچم کانادا" }
    ]
  }
];

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>("recent");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

  // Load recent emojis on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("parham_recent_emojis");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecentEmojis(parsed);
          setActiveCategory("recent");
          return;
        }
      }
    } catch (e) {}
    setActiveCategory("smileys");
  }, []);

  const handleSelectEmoji = (char: string) => {
    // Save to recent emojis
    setRecentEmojis(prev => {
      const filtered = prev.filter(e => e !== char);
      const updated = [char, ...filtered].slice(0, 24);
      try {
        localStorage.setItem("parham_recent_emojis", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    onSelect(char);
  };

  const categoriesWithRecent = useMemo(() => {
    const recentCat: EmojiCategory = {
      id: "recent",
      name: "ایموجی‌های اخیر",
      icon: <Clock className="w-4 h-4 text-amber-400" />,
      emojis: recentEmojis.map(e => ({ char: e, tags: "اخیر recent" }))
    };
    return [recentCat, ...EMOJI_CATEGORIES];
  }, [recentEmojis]);

  // Handle category change or filter emojis by search query
  const displayedEmojis = useMemo(() => {
    if (!searchQuery.trim()) {
      if (activeCategory === "recent") {
        return recentEmojis.map(e => ({ char: e, tags: "اخیر recent" }));
      }
      const category = EMOJI_CATEGORIES.find(c => c.id === activeCategory);
      return category ? category.emojis : [];
    }

    const normalizedQuery = searchQuery.toLowerCase().trim();
    // Gather all matching emojis across all categories
    const results: EmojiItem[] = [];
    EMOJI_CATEGORIES.forEach(cat => {
      cat.emojis.forEach(emoji => {
        if (emoji.tags.toLowerCase().includes(normalizedQuery)) {
          if (!results.some(r => r.char === emoji.char)) {
            results.push(emoji);
          }
        }
      });
    });
    return results;
  }, [activeCategory, searchQuery, recentEmojis]);

  return (
    <div className="flex flex-col h-80 w-72 sm:w-80 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden text-right dir-rtl select-none" dir="rtl">
      {/* Search Input */}
      <div className="p-2 border-b border-slate-800/80 bg-slate-950/60 flex items-center gap-2 relative">
        <Search className="w-3.5 h-3.5 text-slate-500 absolute right-4 top-3.5" />
        <input
          type="text"
          placeholder="جستجوی سریع ایموجی (قلب، خنده، لایک)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-8 pl-8 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="text-[10px] text-slate-500 hover:text-slate-300 absolute left-4 top-3 px-1"
          >
            لغو
          </button>
        )}
      </div>

      {/* Category Tabs (Hidden if searching) */}
      {!searchQuery && (
        <div className="flex items-center gap-1 p-1.5 bg-slate-950/40 border-b border-slate-800/60 overflow-x-auto custom-scrollbar shrink-0">
          {categoriesWithRecent.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`p-1.5 rounded-xl transition shrink-0 flex items-center justify-center ${activeCategory === cat.id ? "bg-indigo-600 text-white shadow-md scale-105" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"}`}
              title={cat.name}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {/* Category Name Banner */}
      {!searchQuery && (
        <div className="px-3 py-1 bg-slate-950/20 text-[10px] font-bold text-slate-400 flex items-center justify-between border-b border-slate-800/30">
          <span>{categoriesWithRecent.find(c => c.id === activeCategory)?.name || "ایموجی‌ها"}</span>
          {activeCategory === "recent" && recentEmojis.length > 0 && (
            <button
              onClick={() => {
                setRecentEmojis([]);
                localStorage.removeItem("parham_recent_emojis");
                setActiveCategory("smileys");
              }}
              className="text-[9px] text-rose-400 hover:text-rose-300 transition"
            >
              پاکسازی اخیر
            </button>
          )}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5">
        {displayedEmojis.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-[10px] py-8 text-center">
            {activeCategory === "recent" && !searchQuery ? (
              <>
                <Clock className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
                <span className="font-bold text-slate-400">هنوز ایموجی اخیری ثبت نشده است</span>
                <span className="mt-1 text-[9px] text-slate-500">هر ایموجی که استفاده کنید به این بخش اضافه می‌شود.</span>
              </>
            ) : (
              <>
                <span>ایموجی یافت نشد!</span>
                <span className="mt-1 text-[8px] text-slate-600">کلمات کلیدی دیگری را امتحان کنید.</span>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5">
            {displayedEmojis.map((emoji, index) => (
              <button
                key={`${emoji.char}-${index}`}
                type="button"
                onClick={() => handleSelectEmoji(emoji.char)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-xl hover:bg-slate-800 hover:scale-125 active:scale-95 transition-all duration-150 cursor-pointer"
              >
                {emoji.char}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 bg-slate-950/60 border-t border-slate-800/60 flex items-center justify-between shrink-0">
        <span className="text-[9px] text-slate-400 font-medium">مجموعه ایموجی پیام‌رسان</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold px-1.5 py-0.5 rounded hover:bg-indigo-950/40 transition"
          >
            بستن
          </button>
        )}
      </div>
    </div>
  );
}
