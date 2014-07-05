/**
 * @package manifest file for Like Posts
 * @version 1.4
 * @author Joker (http://www.simplemachines.org/community/index.php?action=profile;u=226111)
 * @copyright Copyright (c) 2012, Siddhartha Gupta
 * @license http://www.mozilla.org/MPL/MPL-1.1.html
 */

/*
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Initial Developer of the Original Code is
 *  Joker (http://www.simplemachines.org/community/index.php?action=profile;u=226111)
 * Portions created by the Initial Developer are Copyright (C) 2012
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 */

var likePosts = function() {
	this.timeoutTimer = null;
};

likePosts.prototype.likeUnlikePosts = function(e, mId, tId, bId, aId) {
	var userRating = e.target.href.split('#')[1],
		msgId = (mId !== undefined) ? parseInt(mId, 10) : 0,
		topicId = (tId !== undefined) ? parseInt(tId, 10) : 0,
		boardId = (bId !== undefined) ? parseInt(bId, 10) : 0,
		authorId = (aId !== undefined) ? parseInt(aId, 10) : 0,
		rating = (userRating !== undefined) ? parseInt(userRating, 10) : 0;

	if (isNaN(msgId) || isNaN(topicId) || isNaN(boardId) || isNaN(authorId)) {
		return false;
	}

	lpObj.jQRef.ajax({
		type: "POST",
		url: smf_scripturl + '?action=likeposts;sa=like_post',
		context: document.body,
		dataType: "json",
		data: {
			msg: msgId,
			topic: topicId,
			board: boardId,
			rating: rating,
			author: authorId
		},

		success: function(resp) {
			if (resp.response) {
				var params = {
					msgId: msgId,
					count: (resp.count !== undefined) ? resp.count : '',
					newText: resp.newText,
					likeText: resp.likeText,
					rating: rating
				};
				lpObj.onLikeSuccess(params);
			} else {
				//NOTE: Make an error callback over here
			}
		}
	});
	return true;
};

likePosts.prototype.onLikeSuccess = function(params) {
	var count = parseInt(params.count, 10);
	if (isNaN(count)) {
		return false;
	}

	var likeButtonRef = lpObj.jQRef('#like_' + params.msgId),
		likeText = params.likeText,
		newLink = (params.rating === 1) ? '#0' : '#1';

	if (likeText.indexOf('&amp;') > 0) {
		likeText = likeText.replace(/&amp;/g, '&');
	}

	lpObj.jQRef(likeButtonRef).attr('href', newLink);
	lpObj.jQRef(likeButtonRef).animate({
		left: '-40px',
		opacity: 'toggle'
	}, 1000, '', function() {
		lpObj.jQRef(likeButtonRef).text(params.newText);

		lpObj.jQRef(likeButtonRef).animate({
			left: '0px',
			opacity: 'toggle'
		}, 1000);
	});

	if (lpObj.jQRef('#like_count_' + params.msgId).length) {
		if (likeText === '') {
			lpObj.jQRef('#like_count_' + params.msgId).fadeOut(2000).remove();
		} else {
			lpObj.jQRef('#like_count_' + params.msgId).fadeOut(1000, function() {
				lpObj.jQRef(this).text('(' + likeText + ')').fadeIn(1000);
			});
		}
	} else {
		lpObj.jQRef('<span class="display_inline" id="like_count_' + params.msgId + '">(' + likeText + ')</span>').hide().appendTo('#like_post_info_' + params.msgId).fadeIn(2000);
	}

	this.timeoutTimer = setTimeout(function() {
		lpObj.removeOverlay();
	}, 3000);
};

likePosts.prototype.showMessageLikedInfo = function(messageId) {
	if (isNaN(messageId)) {
		return false;
	}

	lpObj.jQRef.ajax({
		type: "GET",
		url: smf_scripturl + '?action=likeposts;sa=get_message_like_info',
		context: document.body,
		dataType: "json",
		data: {
			msg_id: messageId
		},

		success: function(resp) {
			if (resp.response) {
				if (resp.data.length <= 0) {
					return false;
				}

				var data = resp.data,
					memberInfo = '',
					i,
					completeString = '';

				for (i in data) {
					if (data.hasOwnProperty(i)) {
						memberInfo += '<div class="like_posts_member_info"><img class="avatar" src="' + data[i].avatar.href + '" /><div class="like_posts_member_info_details"><a href="' + data[i].href + '">' + data[i].name + '</a></div></div>';
					}
				}
				completeString = '<div class="like_posts_overlay"><div class="like_posts_member_info_box">' + memberInfo + '</div></div>';

				lpObj.jQRef('body').append(completeString);
				lpObj.jQRef(document).one('click keyup', lpObj.removeOverlay);

				lpObj.jQRef('.like_posts_member_info_box').click(function(e) {
					e.stopPropagation();
				});
			} else {
				//NOTE: Make an error callback over here
				return false;
			}
		}
	});
};

likePosts.prototype.showLikeNotification = function() {
	lpObj.jQRef.ajax({
		type: "GET",
		url: smf_scripturl + '?action=likeposts;sa=like_posts_notification',
		context: document.body,
		dataType: "json",

		success: function(resp) {
			if (resp.response) {
				if (resp.data.length <= 0) {
					return false;
				}

				var data = resp.data,
					notificationInfo = '',
					i, j, k,
					dataLengthAll = 0,
					dataLengthMine = 0,
					completeString = '';

				notificationInfo += '<div class="lp_notification_header"><div class="lp_notification_tabs" id="lp_all_notifications">All Notification</div><div class="lp_notification_tabs" id="lp_my_notifications">My Posts</div><div class="lp_notification_tabs close_btn" id="close_notifications">X</div></div>';

				for (i in data) {
					if (data.hasOwnProperty(i)) {
						if (i === 'all') {
							notificationInfo += '<div class="lp_notification_body lp_all_notifications_data">';
							var len = 0;
							if (data[i].length === 0) {
								notificationInfo += '<div class="single_notify">Nothing to show at the moment</div>';
							} else {
								for (j in data[i]) {
									if (data[i].hasOwnProperty(j)) {
										len++;
										notificationInfo += '<div class="single_notify"><img class="avatar" src="' + data[i][j].member.avatar.href + '" /><div class="like_post_notify_data"><a href="' + data[i][j].member.href + '"><strong>' + data[i][j].member.name + '</strong></a> liked ' + '<a href="' + data[i][j].href + '">' + data[i][j].subject + '</a></div></div>';
									}
								}
							}
							dataLengthAll = len;
							notificationInfo += '</div>';
						} else if (i === 'mine') {
							notificationInfo += '<div class="lp_notification_body lp_my_notifications_data" style="display: none">';
							var len = 0;
							if (data[i].length === 0) {
								notificationInfo += '<div class="single_notify">Nothing to show at the moment</div>';
							} else {
								for (k in data[i]) {
									if (data[i].hasOwnProperty(k)) {
										len++;
										notificationInfo += '<div class="single_notify"><img class="avatar" src="' + data[i][k].member.avatar.href + '" /><div class="like_post_notify_data"><a href="' + data[i][k].member.href + '"><strong>' + data[i][k].member.name + '</strong></a> liked ' + '<a href="' + data[i][k].href + '">' + data[i][k].subject + '</a></div></div>';
									}
								}
							}
							dataLengthMine = len;
							notificationInfo += '</div>';
						}
					}
				}
				completeString = '<div class="like_posts_notification">' + notificationInfo + '</div>';

				dataLengthAll = dataLengthAll * 50;
				if (dataLengthAll > 200) {
					dataLengthAll = 200;
				} else if (dataLengthAll < 100) {
					dataLengthAll = 100;
				}

				dataLengthMine = dataLengthMine * 50;
				if (dataLengthMine > 200) {
					dataLengthMine = 200;
				} else if (dataLengthMine < 100) {
					dataLengthMine = 100;
				}
				lpObj.jQRef('body').append(completeString);

				var leftOffset = lpObj.jQRef('.showLikeNotification').offset().left + lpObj.jQRef('.showLikeNotification').width() + 20,
					checkFloat = leftOffset + lpObj.jQRef('.like_posts_notification').outerWidth();

				if (checkFloat > window.innerWidth) {
					leftOffset = lpObj.jQRef('.showLikeNotification').offset().left - lpObj.jQRef('.like_posts_notification').outerWidth() - 20;
					console.log(leftOffset);
				}

				lpObj.jQRef('.like_posts_notification').css({
					'top': lpObj.jQRef('.showLikeNotification').offset().top,
					'left': leftOffset
				});
				lpObj.jQRef('.lp_all_notifications_data').css({
					'height': dataLengthAll + 'px'
				});
				lpObj.jQRef('.lp_my_notifications_data').css({
					'height': dataLengthMine + 'px'
				});

				lpObj.jQRef('#lp_all_notifications').css({
					'font-weight': 'bold'
				});

				lpObj.jQRef('.lp_notification_header').on('click', function(e) {
					e.preventDefault();
					switch (e.target.id) {
						case 'lp_all_notifications':
							lpObj.jQRef('#lp_all_notifications').css({
								'font-weight': 'bold'
							});
							lpObj.jQRef('#lp_my_notifications').css({
								'font-weight': 'normal'
							});
							lpObj.jQRef('.lp_my_notifications_data').hide();
							lpObj.jQRef('.lp_all_notifications_data').show();
							break;

						case 'lp_my_notifications':
							lpObj.jQRef('#lp_all_notifications').css({
								'font-weight': 'normal'
							});
							lpObj.jQRef('#lp_my_notifications').css({
								'font-weight': 'bold'
							});
							lpObj.jQRef('.lp_all_notifications_data').hide();
							lpObj.jQRef('.lp_my_notifications_data').show();
							break;

						case 'close_notifications':
							lpObj.removeNotification(e);
							break;

						default:
							break;
					}
				});
				lpObj.jQRef(document).on('click keyup', lpObj.removeNotification);
			} else {
				//NOTE: Make an error callback over here
				return false;
			}
		}
	});
};

likePosts.prototype.removeNotification = function(e) {
	if ((e.type == 'keyup' && e.keyCode == 27) || e.type == 'click') {
		var container = lpObj.jQRef('#lp_all_notifications, #lp_my_notifications');
		if (!container.is(e.target) && container.has(e.target).length === 0) {
			lpObj.jQRef('.like_posts_notification').unbind('click');
			lpObj.jQRef('.like_posts_notification').unbind('keyup');
			lpObj.jQRef('.lp_notification_header').unbind('click');
			lpObj.jQRef(document).unbind('click', lpObj.removeNotification);
			lpObj.jQRef(document).unbind('keyup', lpObj.removeNotification);
			lpObj.jQRef('.like_posts_notification').remove();
		}
	}
};

likePosts.prototype.bouncEffect = function(element, direction, times, distance, speed) {
	var dir = 'marginLeft',
		anim1 = {},
		anim2 = {},
		i = 0;

	switch (direction) {
		case 'rl':
			dir = 'marginRight';
			break;

		case 'tb':
			dir = 'marginTop';
			break;

		case 'bt':
			dir = 'marginBottom';
			break;

		default:
			break;
	}
	anim1[dir] = '+=' + distance;
	anim2[dir] = '-=' + distance;

	for (; i < times; i++) {
		element.animate(anim1, speed).animate(anim2, speed);
	}
};

// some admin related functions
likePosts.prototype.recountStats = function(options) {
	if (!options.activity) return false;

	var activity = options.activity,
		totalWork = options.totalWork || 0,
		startLimit = options.startLimit || 0,
		increment = options.increment || 100,
		endLimit = options.endLimit || 100;
	lpObj.jQRef.ajax({
		type: "POST",
		url: smf_scripturl + '?action=admin;area=likeposts;sa=recountlikestats',
		dataType: "json",
		data: {
			'activity': activity,
			'totalWork': totalWork,
			'startLimit': startLimit,
			'endLimit': endLimit
		},

		success: function(resp) {
			resp.activity = activity;
			resp.increment = increment;
			resp.startLimit = startLimit;
			lpObj.checkRecount(resp);
		},
		error: function(err) {
			console.log(err);
		}
	});
};

likePosts.prototype.checkRecount = function(obj) {
	var startLimit,
		percentage = 0,
		percentageText = '0%';

	if (obj.startLimit === 0) {
		var completeString = '<div class="like_posts_overlay"><div class="recount_stats"><div></div></div></div>';

		lpObj.jQRef('body').append(completeString);

		var screenWidth = lpObj.jQRef(window).width(),
			screenHeight = lpObj.jQRef(window).height(),
			popupHeight = lpObj.jQRef('.recount_stats').outerHeight(),
			popupWidth = lpObj.jQRef('.recount_stats').outerWidth(),
			topPopUpOffset = (screenHeight - popupHeight) / 2,
			leftPopUpOffset = (screenWidth - popupWidth) / 2;

		lpObj.jQRef('.recount_stats').css({
			top: topPopUpOffset + 'px',
			left: leftPopUpOffset + 'px'
		});
		startLimit = obj.startLimit + obj.increment + 1;
	} else {
		startLimit = obj.startLimit + obj.increment;
	}

	if (startLimit < obj.totalWork) {
		var endLimit = obj.endLimit + obj.increment;
		if (endLimit > obj.totalWork) {
			endLimit = Math.abs(obj.endLimit - obj.totalWork) + obj.endLimit;
		}
		percentage = Math.floor((obj.endLimit / obj.totalWork) * 100);
		percentageText = percentage + '%';
	} else {
		percentage = 100;
		percentageText = 'Done';
		lpObj.jQRef(document).one('click keyup', lpObj.removeOverlay);
	}

	lpObj.jQRef('.recount_stats').find('div').animate({
		width: percentage + '%'
	}, 1000, function() {
		if (percentage < 100) {
			lpObj.recountStats({
				'activity': obj.activity,
				'totalWork': obj.totalWork,
				'startLimit': startLimit,
				'endLimit': endLimit
			});
		}
	}).html(percentageText + '&nbsp;');
};

likePosts.prototype.removeOverlay = function(e) {
	var _this = this;
	if (typeof(e) === 'undefined' && this.timeoutTimer === null) return false;
	else if (this.timeoutTimer !== null || ((e.type == 'keyup' && e.keyCode == 27) || e.type == 'click')) {
		clearTimeout(_this.timeoutTimer);
		_this.timeoutTimer = null;
		lpObj.jQRef('.like_posts_overlay').remove();
		lpObj.jQRef('.like_posts_overlay').unbind('click');
		lpObj.jQRef(document).unbind('click', lpObj.removeOverlay);
		lpObj.jQRef(document).unbind('keyup', lpObj.removeOverlay);
	}
};

var lpObj = window.lpObj = new likePosts();
if (typeof(lpObj.jQRef) !== 'function' && typeof(lpObj.jQRef) === 'undefined') {
	lpObj.jQRef = jQuery.noConflict();
}

(function() {
	lpObj.jQRef(document).ready(function() {
		lpObj.jQRef(".some_data").on('hover', function(e) {
			console.log('on hover');
			e.preventDefault();
			var currText = lpObj.jQRef(this).next().html();

			lpObj.jQRef("<div class=\'subject_details\'></div>").html(currText).appendTo("body").fadeIn("slow");
		}).on('mouseout', function() {
			console.log('on mouseout');
			lpObj.jQRef(".subject_details").fadeOut("slow");
			lpObj.jQRef(".subject_details").remove();
		}).on('mousemove', function(e) {
			console.log('on mousemove');
			var mousex = e.pageX + 20,
				mousey = e.pageY + 10,
				width = lpObj.jQRef("#wrapper").width() - mousex - 50;

			lpObj.jQRef(".subject_details").css({
				top: mousey,
				left: mousex,
				width: width + "px"
			});
		});
	});
})();
