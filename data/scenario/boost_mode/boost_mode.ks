; テキスト高速表示モード追加プラグイン Ver6対応版
; 原版: Studio Overdrive http://studio-overdrive.com/ (Ver2.74 向け)
;
;
; ＜使い方＞
;   最初に、boost_mode.ksを読み込んでください。
;   [call storage="boost_mode/boost_mode.ks"]
;
;   [boost_mode_on]……テキストを一括描画ON
;   [boost_mode_off]……テキストを一括描画OFF(1文毎描画)
;
; ＜注意点＞
;   本版は TyranoScript Ver6 向けに書き換えられています。
;   エンジン本体のファイルは変更せず、data/others/boost_mode/boost_mode.js が
;   実行時に tag.text.addChars をラップします。
;
;
[loadjs storage="boost_mode/boost_mode.js"]
[macro name="boost_mode_on"]
[iscript]
sutdioOverdrive.tyrano.kag.stat.is_boost_mode = true;
[endscript]
[endmacro]

[macro name="boost_mode_off"]
[iscript]
sutdioOverdrive.tyrano.kag.stat.is_boost_mode = false;
[endscript]
[endmacro]
[return]
