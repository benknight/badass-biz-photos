/**
 * A fixed-height scrollable region that uses a top and bottom shadow to
 * indicate scrollability of the content region.
 *
 * by Benjamin Knight / MIT License
 */
(function($){

	$.fn.shadowedScroller = function(options) {

		return this.each(function() {

			/**
			 * Plugin options:
			 *
			 * 1. height {Number} The fixed height of the scrollable area.
			 * 2. shadow_size {Number} The size and curvature of the shadow.
			 * 3. shadow_color {String} The color of the shadow.
			 */
			options = $.extend({
				height:       200,
				shadow_size:  30,
				shadow_color: 'black'
			}, options);

			var shadow_css = {
				'position': 'absolute',
				'z-index': '1',
				'width': '100%',
				'height': options.shadow_size,
				'border-radius': '50%',
				'box-shadow': '0 0 ' + options.shadow_size + 'px ' + options.shadow_color
			};

			var $this = $(this),
				container = $([
					'<div class="ss-container">',
						'<div class="ss-top"></div>',
						'<div class="ss-content">',
							'<div class="ss-inner"></div>',
						'</div>',
						'<div class="ss-bottom"></div>',
					'</div>'
				].join('')),
				top     = container.find('.ss-top'),
				content = container.find('.ss-content'),
				inner   = container.find('.ss-inner'),
				bottom  = container.find('.ss-bottom');

			// Transition function that fades in and out quickly, inverse ease-in-out.
			var hardInOut = function(val) {
				return 4 * Math.pow((val - 0.5), 3) + 0.5;
			};

			var setOpacity = function() {
				var h = inner.outerHeight() - content.innerHeight();
				var s = content.scrollTop();
				top.css({ 'opacity': hardInOut(s / h) });
				bottom.css({ 'opacity': hardInOut(1 - ( s / h )) });
			};

			// set styles
			container.css({
				'position': 'relative',
				'overflow': 'hidden'
			});

			content.css({
				'overflow': 'auto',
				'height': options.height
			});

			top.css(shadow_css).css('top', -1 * options.shadow_size);
			bottom.css(shadow_css).css('bottom', -1 * options.shadow_size);

			content.bind('scroll', setOpacity);
			container.insertBefore($this);
			$this.appendTo(inner);
			setOpacity();
		});
	};

})(jQuery);