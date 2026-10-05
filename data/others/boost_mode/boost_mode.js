// テキスト高速表示モード追加プラグイン（TyranoScript Ver6 対応版）
// 原版: Studio Overdrive http://studio-overdrive.com/ (Ver2.74 向け)
//
// 本版の変更点:
//   旧版は tyrano.plugin.kag.tag.text.showMessage を Ver2.74 の内部実装で
//   丸ごと上書きしていたが、Ver6 ではテキスト描画パイプラインが根本的に
//   異なるため、addChars のみをラップする最小介入型に書き換えた。
//   これにより装飾・縦書き・バックログ・グリフ・[l][p] 待機など
//   Ver6 本体の処理はすべてそのまま維持される。
//
// ついでに本家 addChars の即時表示分岐（[nowait] / ch_speed<=3 も通る）
// にある以下の問題も、boost_mode 経路では回避している。
//   - メッセージウィンドウ非表示中だと nextOrder が捨てられ停滞する
//     （finishAddingChars 経由にして messagewindow-show 復帰を有効化）
//   - tmp.processed_click_interrupt がリセットされず、直後の通常テキストで
//     クリックによるマッハ表示が効かなくなる
//   - skipSpeed(30ms) の遅延が nowait にも一律適用される

if (typeof sutdioOverdrive === "undefined") {
    var sutdioOverdrive = {};
}
if (sutdioOverdrive.tyrano === undefined) {
    sutdioOverdrive.tyrano = {};
}
if (sutdioOverdrive.tyrano.kag === undefined) {
    sutdioOverdrive.tyrano.kag = {};
}
if (sutdioOverdrive.tyrano.kag.stat === undefined) {
    sutdioOverdrive.tyrano.kag.stat = {};
}
if (sutdioOverdrive.tyrano.kag.stat.is_boost_mode === undefined) {
    sutdioOverdrive.tyrano.kag.stat.is_boost_mode = false;
}
if (sutdioOverdrive.tyrano.kag.stat.is_boost_mode_click === undefined) {
    sutdioOverdrive.tyrano.kag.stat.is_boost_mode_click = false;
}

// 旧版の名前空間は "sutdioOverdrive"（タイポ）だが、
// 修正版の綴りで参照するシナリオ側コードにも対応できるようエイリアスを用意
if (typeof studioOverdrive === "undefined") {
    var studioOverdrive = sutdioOverdrive;
}

(function () {
    // boost_mode.ks を再 [call] された場合などの二重適用を防ぐ
    if (sutdioOverdrive.tyrano.kag.stat._boost_mode_patched === true) {
        return;
    }
    sutdioOverdrive.tyrano.kag.stat._boost_mode_patched = true;

    var text_tag = tyrano.plugin.kag.tag.text;
    var original_addChars = text_tag.addChars;

    text_tag.addChars = function (j_message_span, j_msg_inner, is_vertical) {
        var stat = this.kag.stat;
        var tmp = this.kag.tmp;

        // スキップ中は本家の処理に委譲（スキップペーシングを維持するため）
        if (stat.is_skip === true) {
            return original_addChars.apply(this, arguments);
        }

        // 文字表示速度の判定（本家 addChars と同じロジック）
        var ch_speed = 30;
        if (stat.ch_speed !== "") {
            ch_speed = parseInt(stat.ch_speed);
        } else if (this.kag.config.chSpeed) {
            ch_speed = parseInt(this.kag.config.chSpeed);
        }

        // 即時表示すべき条件
        // - boost_mode が有効
        // - [nowait] 中
        // - 1文字あたりの表示時間が 3 ミリ秒以下
        var should_instant =
            sutdioOverdrive.tyrano.kag.stat.is_boost_mode === true ||
            stat.is_nowait ||
            ch_speed <= 3;

        if (!should_instant) {
            return original_addChars.apply(this, arguments);
        }

        // ---- 以下、本家 addChars の即時表示分岐相当（バグ回避版）----

        var j_char_span_children = j_message_span.find(".char");

        // グラデーションの設定が有効な場合
        var font = stat.font;
        if (font.gradient && font.gradient !== "none") {
            var j_target = tmp.is_individual_decoration
                ? j_char_span_children.find(".fill")
                : j_char_span_children;
            j_target.setGradientText(font.gradient);
        }

        // セリフのカギカッコフロート
        if (tmp.should_set_reverse_indent) {
            this.setReverseIndent(j_msg_inner, j_char_span_children);
        }

        // 禁則処理
        if (this.getMessageConfig("control_line_break") === "true") {
            this.controlLineBreak(j_char_span_children, is_vertical);
        }

        // 全文字を一瞬で表示
        this.makeAllCharsVisible(j_char_span_children);

        // 前のテキストで立ったままの割り込み処理済みフラグをリセットして
        // 次の通常テキストのクリック割り込みが妨げられないようにする
        tmp.processed_click_interrupt = false;

        // 本家の即時分岐は is_hide_message 時に nextOrder が捨てられ停滞
        // しうるため、復帰リスナを登録する finishAddingChars 経由にする。
        // 遅延はスキップ以外では不要なので 0 にする（本家は一律 skipSpeed）。
        var that = this;
        setTimeout(function () {
            that.finishAddingChars();
        }, 0);
    };

    // ---- オプション: 表示中クリックで残りを一括表示（Ver5 相当の挙動）----
    //
    // 本家は表示中クリック時に checkClickInterrupt が tmp.ch_speed を
    // ch_speed_in_click（既定 1ms）へ書き換え、残り文字が高速逐次表示
    // される「マッハ表示」になる。Ver5 系はクリック時点で
    // makeAllCharsVisible + finishAddingChars を即実行してループごと
    // 終了していた。
    // is_boost_mode_click が有効な場合は Ver5 と同じく、クリック検出で
    // 全文字を可視化して即 finishAddingChars し、以後の再帰呼び出しを
    // 行わない（ループの空回りが残らない）。
    // フラグ OFF 時とスキップ中は本家の処理に委譲する。
    var original_addOneChar = text_tag.addOneChar;

    text_tag.addOneChar = function (char_index, j_char_span_children, j_message_span, j_msg_inner) {
        var stat = this.kag.stat;
        var tmp = this.kag.tmp;

        if (
            sutdioOverdrive.tyrano.kag.stat.is_boost_mode_click === true &&
            stat.is_click_text &&
            !tmp.processed_click_interrupt
        ) {
            tmp.processed_click_interrupt = true;
            if (tmp.popopo.key) {
                tmp.popopo.player.stop();
            }
            this.makeAllCharsVisible(j_char_span_children);
            this.finishAddingChars();
            return;
        }
        return original_addOneChar.apply(this, arguments);
    };
})();
