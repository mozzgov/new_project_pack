'use strict';

function open_menu(menu, open) {
    let div_menu = menu,
        body = $('html, body');
    open.toggleClass('open');
    if (open.hasClass('open')) {
        $(document).find(div_menu).slideDown({
            start: function () {
                $(this).css({
                    display: "flex"
                })
            }
        });
    } else {
        $(document).find(div_menu).slideUp(350, function() {
            open.removeClass('open');
            $(this).removeAttr("style");// options
        });
    }
}

function header_bg_scroll() {
    var $header = $('.js-header-bg');
    var $winScroll = $(window).scrollTop();
    if (150 <= $winScroll) {
        $header.addClass('header-bg');
    } else {
        $header.removeClass('header-bg').removeAttr('style')
    }
}

$(document).ready(function () {
    $(window).scroll(function() {
        header_bg_scroll();
    });

    $('.menu_open_close').click(function(e) {
        e.preventDefault();
        var menu = $('.header_nav');
        var open = $(this);
        open_menu(menu, open);
    });

    $('a.down[href^="#"]').on('click', function(event) {
        let target = $($(this).attr('href')),
            offset_down = $(this).data('offsetdown') === undefined ? 0 : $(this).data('offsetdown');

        if (target.length) {
            event.preventDefault();
            $('html, body').animate({
                scrollTop: target.offset().top + offset_down,
            }, 800, 'swing');
        }
    });

});
