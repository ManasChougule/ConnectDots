class ToggleFriend {
    constructor(toggleElement) {
        this.toggleFriendBtn = toggleElement;
        this.toggleFriend();
    }

    toggleFriend() {
        $(this.toggleFriendBtn).click(function (event) {
            event.preventDefault();

            let self = this;
            let action = $(self).data('action');

            $.ajax({
                type: "GET",
                url: $(self).attr('href') + `&action=${action}`,
            })
            .done(function (data) {
                if (data.data.deleted === true) {
                    $(self).html(`Add Friend`).data('action', 'add').removeClass('btn-outline-danger').addClass('btn-outline-success');
                } else if (data.data.deleted === false) {
                    if (action === 'add' && data.data.flag === 1) {
                        $(self).html(`Pending`);
                    }
                    if (action === 'remove' && data.data.flag === 0) {
                        $(self).html(`Add Friend`).data('action', 'add').removeClass('btn-outline-danger').addClass('btn-outline-success');
                    }
                } else if (data.data.closeFriendDeleted === 1) {
                    $(self).html(`Add`).data('action', 'add').removeClass('btn-outline-danger').addClass('btn-outline-success');
                } else if (data.data.closeFriendDeleted === 0) {
                    $(self).html(`Remove`).data('action', 'remove').removeClass('btn-outline-success').addClass('btn-outline-danger');
                }

                setTimeout(() => {
                    location.reload();
                }, 400);  
            })
            .fail(function (error) {
                console.error("Error in AJAX request:", error);
            });
        });
    }
}