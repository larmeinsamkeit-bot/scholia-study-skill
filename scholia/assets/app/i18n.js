/* ---------- i18n ---------- */
const UI = {
  "zh-Hant": {
    langName:"繁體中文", langLabel:"介面語言", dashboard:"主頁", notebook:"錯題簿", course:"課程", units:"單元",
    midterm:"期中溫習", final:"期末溫習", export:"匯出進度", import:"匯入進度", continueUnit:"繼續第 {n} 單元",
    unitN:"第 {n} 單元", stageN:"第 {n} 階段", before:"課前", inClass:"課堂", after:"課後", done:"已完成", next:"下一步",
    doneOf:"已完成 {a}/{b} 個階段", greeting:"你好！第 {n} 單元正等你進入第 {s} 階段。", allDone:"你好！所有單元都已完成，可以開始溫習考試。",
    pathFor:"第 {n} 單元學習路徑", allUnits:"全部單元", marginNotes:"Scholia · 頁邊批註",
    weak:"薄弱知識點", weakSub:"你錯過不止一次的概念。", weakNone:"暫時未有。做完幾份測驗後，這裏會顯示你最常錯的概念。", misses:"錯 {n} 次",
    due:"今日待重測", dueSub:"{n} 道舊錯題到期重測 — 記得愈牢，下次間隔愈長。", dueNone:"今日沒有待重測的題目。", startRetest:"開始 {n} 題重測",
    examIn:"距離{name} {n} 日", examToday:"{name}就在今日", examScope:"考試範圍：{units}。", openReview:"打開{name} →",
    fromClass:"課堂提問", fromClassSub:"第 {n} 單元有 {a} 個課堂提問已獲解答。",
    s_prestudy:"預習資料", s_prequiz:"預習題", s_premistakes:"預習錯題與難點", s_classroom:"課堂提問記錄", s_review:"課後溫習", s_postmistakes:"課後錯題與難點", s_homework:"功課解答",
    d_prestudy:"學習目標、導讀摘要、關鍵詞彙", d_prequiz:"{n} 道題 · 即時回饋", d_premistakes:"你的錯題逐一講解", d_classroom:"隨時記低上堂的疑問", d_review:"重點回顧、記憶卡、溫習測驗", d_postmistakes:"溫習錯題與深層難點", d_homework:"先給提示，再看完整步驟",
    minutes:"約 {n} 分鐘", objectives:"讀完之後你可以", keyTerms:"關鍵詞彙", source:"出處", buildsOn:"建基於", watch:"留意", listen:"上堂留心聽", note:"批註",
    markRead:"讀完了 · 開始預習題 →", markDone:"標記為完成", markedDone:"已完成 ✓", objChecked:"已勾選 {a}/{b} 個目標",
    qOf:"第 {i} 題，共 {n} 題", rightWrong:"{a} 對 · {b} 錯", single:"單選", multi:"多選（可選多於一項）", tf:"是非題", short:"簡答題",
    easy:"易", medium:"中", hard:"難", howSure:"你有幾肯定？", conf0:"估吓", conf1:"幾肯定", conf2:"好肯定",
    check:"檢查答案", nextQ:"下一題 →", finish:"完成", tryAgain:"重新作答", right:"答對了", rightGuess:"答對了 — 不過你是估的", notQuite:"答錯了",
    whyTempting:"為甚麼 {k} 咁吸引：", addedNb:"↳ 已加入錯題簿 · 1 日後重測", yourAnswer:"你的答案", correct:"正確答案", answer:"答案",
    true:"正確", false:"錯誤", writeAnswer:"在這裏寫你的答案…", showModel:"看參考答案", gotIt:"我答對了", missedIt:"我答錯了", modelAnswer:"參考答案",
    quizDone:"做完了！", quizScore:"{a}/{n} 題答對。", toMistakes:"看錯題與難點 →", redo:"再做一次",
    mineTitle:"你的錯題，逐一講解", mineSub:"{w} 道答錯、{g} 道估中。每道題會按你的記憶程度再次出現，直至掌握。", fromQuiz:"來自你的測驗",
    noMistakes:"這一部分沒有錯題，做得好！", doQuizFirst:"先完成{quiz}，你的錯題就會出現在這裏。", goQuiz:"去做{quiz} →",
    wrongSure:"答錯 · 你{conf}", luckyGuess:"答對 · 但你是估的", retestOn:"下次重測：{d}", similar:"再試一次",
    anticipated:"根據教材預計的難點", hardTitle:"這個單元難在哪裏", hardSub:"一般同學容易卡住的地方 — 在你遇到之前先寫好。",
    linked:"與你的錯題相關", whyTrips:"為甚麼容易錯：", theFix:"解決方法：", stuck:"仍然唔明？", stuckSub:"把它寫成課堂提問 — 帶去上堂問，或者匯出後交給 Claude 解答。", addToClass:"加入課堂提問",
    cqTitle:"課堂提問記錄", cqSub:"上堂時隨時記低疑問。之後匯出，貼給 Claude 就會得到解答。", cqPlaceholder:"例如：為甚麼期望值可以不是 X 可取的值？", add:"加入",
    cqNone:"暫時未有提問。", export_q:"匯出提問給 Claude", copied:"已複製，可以貼到 Claude。", copyFail:"未能自動複製 — 請手動選取下面的文字。",
    delete:"刪除", listenFor:"上堂留心聽", answered:"Scholia 已解答",
    recap:"重點回顧", keyPoints:"要記住的重點", flashcards:"記憶卡", flip:"翻轉", know:"我記得", again:"再溫一次", cardOf:"第 {i} 張，共 {n} 張", known:"記得 {k} 張",
    connections:"與其他單元的關係", reviewQuiz:"溫習測驗",
    hint:"提示 {i}", showHint:"顯示下一個提示", showSolution:"顯示完整解答", lockedSolution:"先看完所有提示，才可以看完整解答。", steps:"步驟", pitfalls:"常見錯誤", lowConf:"答案未完全確定 — 請向導師核實", noHw:"這個單元沒有上載功課。",
    readiness:"各單元準備程度", readinessSub:"答對而且有信心的比例", themes:"主要主題", formulaSheet:"公式表", strategy:"應試策略", startWith:"建議先溫：{u}。",
    mock:"模擬考試", mockInfo:"{n} 題 · {m} 分鐘", mockSub:"混合範圍內所有單元。交卷前不會顯示對錯 — 跟真正考試一樣。", start:"開始作答", lastAttempt:"上次：{a}/{n}", best:"最佳：{a}/{n}",
    submit:"交卷", timeLeft:"剩餘時間", flag:"標記", flagged:"已標記", submitConfirm:"確定交卷？還有 {n} 題未作答。", result:"成績", scored:"得分 {a}/{n}（{p}%）", selfMark:"自評", review_:"檢討答案", newAttempt:"再考一次", backToReview:"返回溫習",
    nbTitle:"錯題簿", nbSub:"所有答錯或估中的題目。重測間隔超過三星期，就算「掌握」。", nbDue:"今日要重測", nbLater:"之後重測", nbMastered:"已掌握", nbEmpty:"錯題簿是空的。", dueOn:"{d} 重測", retestTitle:"重測",
    exportTitle:"匯出進度", exportSub:"下載備份檔（可在其他電腦匯入），或者複製學習摘要貼給 Claude，讓它針對你的弱項講解。", download:"下載備份檔", copySummary:"複製學習摘要給 Claude", close:"關閉", importDone:"已匯入進度。", importFail:"無法讀取這個檔案。",
    today:"今日", tomorrow:"明日", inDays:"{n} 日後", theme:"主題", light:"淺色", dark:"深色", auto:"自動", localNote:"進度只儲存在這個瀏覽器。", min:"分鐘", codeTitle:"轉移到另一部裝置", codeSub:"複製進度代碼，用 WhatsApp、微信或電郵傳到另一部裝置，再在那裏貼上。", codeCopy:"複製進度代碼", codePaste:"貼上進度代碼", codeApply:"套用代碼（會取代這部裝置的進度）", codeFail:"代碼無效，請確認已完整複製。", drillTitle:"練習卷", drillSub:"由範圍內各單元的題目隨機抽 10 題，即時對答案。", drillRandom:"隨機練習卷（10 題）", drillWeak:"弱項練習卷（{n} 題）", drillNone:"未有足夠題目。", byConcept:"各概念得分", todayTitle:"今日溫習", todayMistakes:"{n} 道錯題待重測", todayCards:"{n} 張記憶卡待複習", todayNext:"下一步：{u} · {s}", todayNone:"今日沒有待溫習的項目，做得好！", cardsTitle:"記憶卡複習", cardsDone:"完成！今日複習了 {n} 張記憶卡。", cardsNone:"今日沒有到期的記憶卡。", contentOnly:"課程內容只有{langs}版本；切換語言只會改變介面。", backupTitle:"備份進度", backupNever:"你還未備份過進度。", backupAgo:"上次備份：{n} 日前。", backupSub:"Safari 等瀏覽器可能會刪除一段時間沒有打開的網站資料。定期下載備份檔最安全。", backupNow:"立即下載備份", search:"搜尋", searchPh:"搜尋概念、公式、題目…", searchNone:"找不到「{q}」。", searchCount:"{n} 個結果", sheet:"重點總覽", sheetSub:"所有單元的重點、關鍵詞彙和公式表，適合考前列印。", print:"列印／存成 PDF", ics:"加到日曆 (.ics)", icsSub:"上堂日、考試日和錯題重測日。下載後打開檔案，就會加入 iPhone、Mac 或 Google 日曆。", icsLecture:"{u}：{t}", icsRetest:"Scholia：{n} 道錯題重測", icsDone:"已下載日曆檔，打開它就可以加入日曆。", icsMidterm:"期中考試", icsFinal:"期末考試"
  },
  "zh-Hans": null,
  "en": {
    langName:"English", langLabel:"Interface language", dashboard:"Dashboard", notebook:"Mistake notebook", course:"Course", units:"Units",
    midterm:"Midterm review", final:"Final review", export:"Export progress", import:"Import progress", continueUnit:"Continue Unit {n}",
    unitN:"Unit {n}", stageN:"Stage {n}", before:"Before", inClass:"In class", after:"After", done:"Done", next:"Next",
    doneOf:"{a} of {b} stages done", greeting:"Hello! Unit {n} is waiting at stage {s}.", allDone:"Hello! Every unit is done — time to review for exams.",
    pathFor:"The path for Unit {n}", allUnits:"All units", marginNotes:"Scholia · margin notes",
    weak:"Weak spots", weakSub:"Concepts you've missed more than once.", weakNone:"Nothing yet. After a few quizzes, the concepts you miss most will show here.", misses:"{n} misses",
    due:"Due for re-test today", dueSub:"{n} old mistakes are due — the better you remember, the longer the next gap.", dueNone:"Nothing to re-test today.", startRetest:"Start {n}-question re-test",
    examIn:"{name} in {n} days", examToday:"{name} is today", examScope:"Covers {units}.", openReview:"Open {name} →",
    fromClass:"From class", fromClassSub:"{a} classroom questions are answered in Unit {n}.",
    s_prestudy:"Pre-study materials", s_prequiz:"Pre-study quiz", s_premistakes:"Mistakes & difficulties", s_classroom:"Classroom questions", s_review:"After-class review", s_postmistakes:"Mistakes & difficulties", s_homework:"Homework solutions",
    d_prestudy:"Objectives, guided summary, key terms", d_prequiz:"{n} questions · instant feedback", d_premistakes:"Your errors, explained", d_classroom:"Log questions as they come", d_review:"Recap, flashcards, review quiz", d_postmistakes:"Review-quiz errors, deeper fixes", d_homework:"Hints first, then full steps",
    minutes:"about {n} min", objectives:"After this you can", keyTerms:"Key terms", source:"Source", buildsOn:"Builds on", watch:"Watch for", listen:"Listen for in class", note:"Note",
    markRead:"Mark read · start the pre-study quiz →", markDone:"Mark as done", markedDone:"Done ✓", objChecked:"{a} of {b} objectives checked",
    qOf:"Question {i} of {n}", rightWrong:"{a} right · {b} wrong", single:"Single answer", multi:"Select all that apply", tf:"True or false", short:"Short answer",
    easy:"easy", medium:"medium", hard:"hard", howSure:"How sure are you?", conf0:"Guessing", conf1:"Fairly sure", conf2:"Certain",
    check:"Check answer", nextQ:"Next question →", finish:"Finish", tryAgain:"Try again", right:"Right", rightGuess:"Right — but you were guessing", notQuite:"Not quite",
    whyTempting:"Why {k} is tempting:", addedNb:"↳ Added to your mistake notebook · re-test in 1 day", yourAnswer:"You said", correct:"Answer", answer:"Answer",
    true:"True", false:"False", writeAnswer:"Write your answer here…", showModel:"Show model answer", gotIt:"I got it", missedIt:"I missed it", modelAnswer:"Model answer",
    quizDone:"Finished!", quizScore:"{a} of {n} right.", toMistakes:"See mistakes & difficulties →", redo:"Do it again",
    mineTitle:"Your mistakes, explained", mineSub:"{w} wrong and {g} lucky guesses. Each comes back on a schedule that adapts to how well you remember it.", fromQuiz:"From your quiz",
    noMistakes:"No mistakes here — nice work!", doQuizFirst:"Finish the {quiz} and your mistakes will appear here.", goQuiz:"Go to the {quiz} →",
    wrongSure:"Wrong · you were {conf}", luckyGuess:"Right · but guessing", retestOn:"Next re-test: {d}", similar:"Try it again",
    anticipated:"Anticipated from the materials", hardTitle:"Where this unit gets hard", hardSub:"Spots where students usually stumble, written before you meet them.",
    linked:"linked to your mistakes", whyTrips:"Why it trips people:", theFix:"The fix:", stuck:"Still stuck?", stuckSub:"Write it down as a classroom question — ask in lecture, or export it and paste it to Claude.", addToClass:"Add to classroom questions",
    cqTitle:"Classroom questions", cqSub:"Jot questions down during lecture. Export them later and paste to Claude for answers.", cqPlaceholder:"e.g. Why can an expected value be a value X never takes?", add:"Add",
    cqNone:"No questions yet.", export_q:"Export questions for Claude", copied:"Copied — paste it to Claude.", copyFail:"Couldn't copy automatically — select the text below.",
    delete:"Delete", listenFor:"Listen for in class", answered:"Answered by Scholia",
    recap:"Recap", keyPoints:"Key points", flashcards:"Flashcards", flip:"Flip", know:"I know it", again:"Again", cardOf:"Card {i} of {n}", known:"{k} known",
    connections:"How this connects", reviewQuiz:"Review quiz",
    hint:"Hint {i}", showHint:"Show next hint", showSolution:"Show full solution", lockedSolution:"Work through every hint first; then the full solution unlocks.", steps:"Steps", pitfalls:"Common pitfalls", lowConf:"Not fully certain — check with your instructor", noHw:"No homework uploaded for this unit.",
    readiness:"Readiness by unit", readinessSub:"share of answers right and sure", themes:"The big themes", formulaSheet:"Formula sheet", strategy:"Exam strategy", startWith:"Start with {u}.",
    mock:"Mock exam", mockInfo:"{n} questions · {m} minutes", mockSub:"Mixed across the scope. No feedback until you submit — like the real thing.", start:"Start", lastAttempt:"Last: {a}/{n}", best:"Best: {a}/{n}",
    submit:"Submit", timeLeft:"Time left", flag:"Flag", flagged:"Flagged", submitConfirm:"Submit now? {n} questions are unanswered.", result:"Result", scored:"Scored {a}/{n} ({p}%)", selfMark:"Self-mark", review_:"Review answers", newAttempt:"New attempt", backToReview:"Back to review",
    nbTitle:"Mistake notebook", nbSub:"Every wrong answer and lucky guess. Once its re-test gap passes three weeks, it counts as mastered.", nbDue:"Due today", nbLater:"Coming up", nbMastered:"Mastered", nbEmpty:"Your notebook is empty.", dueOn:"re-test {d}", retestTitle:"Re-test",
    exportTitle:"Export progress", exportSub:"Download a backup (import it on another computer), or copy a study summary to paste to Claude so it can target your weak spots.", download:"Download backup", copySummary:"Copy summary for Claude", close:"Close", importDone:"Progress imported.", importFail:"Couldn't read that file.",
    today:"today", tomorrow:"tomorrow", inDays:"in {n} days", theme:"Theme", light:"Light", dark:"Dark", auto:"Auto", localNote:"Progress is saved in this browser only.", min:"min", codeTitle:"Move to another device", codeSub:"Copy a progress code, send it to your other device by chat or email, and paste it there.", codeCopy:"Copy progress code", codePaste:"Paste a progress code", codeApply:"Apply code (replaces this device's progress)", codeFail:"That code isn't valid — make sure you copied all of it.", drillTitle:"Practice set", drillSub:"10 random questions from the units in scope, with instant feedback.", drillRandom:"Random practice set (10)", drillWeak:"Weak-spot practice ({n})", drillNone:"Not enough questions yet.", byConcept:"Score by concept", todayTitle:"Today's review", todayMistakes:"{n} mistakes due for re-test", todayCards:"{n} flashcards due", todayNext:"Next: {u} · {s}", todayNone:"Nothing due today — nice work!", cardsTitle:"Flashcard review", cardsDone:"Done! You reviewed {n} flashcards today.", cardsNone:"No flashcards are due today.", contentOnly:"Course content is only available in {langs}; switching changes the interface only.", backupTitle:"Back up your progress", backupNever:"You haven't backed up yet.", backupAgo:"Last backup: {n} days ago.", backupSub:"Safari and some other browsers may delete data for sites you haven't opened in a while. A downloaded backup is the safe copy.", backupNow:"Download a backup now", search:"Search", searchPh:"Search concepts, formulas, questions…", searchNone:"Nothing found for “{q}”.", searchCount:"{n} results", sheet:"Study sheet", sheetSub:"Key points, key terms and formula sheets for every unit — made for printing before exams.", print:"Print / save as PDF", ics:"Add to calendar (.ics)", icsSub:"Lecture days, exam days and re-test days. Open the downloaded file to add them to iPhone, Mac or Google Calendar.", icsLecture:"{u}: {t}", icsRetest:"Scholia: {n} mistakes to re-test", icsDone:"Calendar file downloaded — open it to add the events.", icsMidterm:"Midterm exam", icsFinal:"Final exam"
  }
};
// Simplified Chinese: derive from Traditional with a small character map (UI strings only).
(function(){
  const T2S = {"體":"体","單":"单","課":"课","題":"题","習":"习","頁":"页","錯":"错","識":"识","測":"测","詞":"词","彙":"汇","階":"阶","段":"段","進":"进","繼":"继","續":"续","導":"导","記":"记","復":"复","溫":"温","學":"学","這":"这","個":"个","為":"为","會":"会","說":"说","時":"时","問":"问","對":"对","後":"后","們":"们","裏":"里","麼":"么","於":"于","與":"与","應":"应","試":"试","準":"准","備":"备","項":"项","選":"选","論":"论","範":"范","圍":"围","離":"离","開":"开","間":"间","隔":"隔","現":"现","讀":"读","標":"标","勾":"勾","據":"据","計":"计","難":"难","點":"点","決":"决","法":"法","帶":"带","貼":"贴","給":"给","據":"据","會":"会","處":"处","語":"语","言":"言","匯":"汇","出":"出","入":"入","頁":"页","邊":"边","註":"注","批":"批","斷":"断","績":"绩","評":"评","剩":"剩","餘":"余","確":"确","定":"定","還":"还","張":"张","翻":"翻","轉":"转","關":"关","係":"系","顯":"显","示":"示","專":"专","業":"业","將":"将","儲":"储","存":"存","覽":"览","器":"器","載":"载","檔":"档","複":"复","製":"制","摘":"摘","針":"针","講":"讲","解":"解","淺":"浅","深":"深","動":"动","鐘":"钟","約":"约","聽":"听","寫":"写","議":"议","掌":"掌","握":"握","簿":"本","嗎":"吗","啲":"些","咁":"这么","喺":"在","冇":"没有","唔":"不","嘅":"的","吓":"一下","幾":"几","肯":"肯","估":"猜","當":"当","並":"并","從":"从","們":"们","賽":"赛","極":"极","經":"经","驗":"验","過":"过","樣":"样","無":"无","層":"层","號":"号","筆":"笔","練":"练","級":"级","數":"数","據":"据","價":"价","態":"态","機":"机","率":"率","統":"统","條":"条","變":"变","積":"积","術":"术","語":"语","資":"资","料":"料","即":"即","時":"时","饋":"馈","低":"下","堂":"堂","嚟":"来","畀":"给","睇":"看","係":"是","佢":"它","揀":"选","徑":"径","暫":"暂","舊":"旧","沒":"没","獲":"获","預":"预","錄":"录","鍵":"键","隨":"随","顧":"顾","憶":"忆","驟":"骤","簡":"简","檢":"检","誤":"误","參":"参","連":"连","兩":"两","來":"来","請":"请","刪":"删","見":"见","師":"师","實":"实","擬":"拟","內":"内","討":"讨","電":"电","腦":"脑","讓":"让","閉":"闭","瀏":"浏","換":"换","僅":"仅","與":"与","尋":"寻","曆":"历","結":"结","網":"网","總":"总","適":"适","擇":"择","詢":"询","份":"份","鬆":"松"};
  const conv = s => s.replace(/搜尋/g,"搜索").replace(/列印/g,"打印").replace(/備份檔/g,"备份文件").replace(/日曆檔/g,"日历文件").replace(/檔案/g,"文件").replace(/網站資料/g,"网站数据").replace(/存成/g,"保存为").replace(/(\d|\}) 日前/g,"$1 天前").replace(/介面/g,"界面").replace(/匯出/g,"导出").replace(/匯入/g,"导入").replace(/估吓/g,"猜一下").replace(/幾肯定/g,"比较肯定").replace(/好肯定/g,"非常肯定").replace(/咁吸引/g,"这么吸引").replace(/仍然唔明/g,"仍然不明白").replace(/記低上堂的疑問/g,"记下上课的疑问").replace(/上堂/g,"上课").replace(/估中/g,"猜中").replace(/估的/g,"猜的").replace(/功課/g,"作业").replace(/溫習/g,"复习").replace(/./g, c => T2S[c] || c);
  const zs = {}; const zt = UI["zh-Hant"];
  for (const k in zt) zs[k] = conv(zt[k]);
  zs.langName = "简体中文"; zs.langLabel = "界面语言"; zs.notebook = "错题本"; zs.s_homework = "作业解答"; zs.nbTitle = "错题本";
  UI["zh-Hans"] = zs;
})();
const LANGS = ["zh-Hant","zh-Hans","en"];
