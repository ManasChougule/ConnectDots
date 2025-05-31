// CHANGE :: create a class to toggle likes when a link is clicked, using AJAX
class ToggleLike{
    constructor(toggleElement){
        this.toggler = toggleElement;
        this.toggleLike();
    }


    toggleLike(){
        $(this.toggler).click(function(e){
            e.preventDefault();
            let self = this;

            // this is a new way of writing ajax which you might've studied, it looks like the same as promises
            $.ajax({
                type: 'POST',
                url: $(self).attr('href'),
            })
            .done(function(data) {
                
                let likesCount = parseInt($(self).attr('data-likes'));
                // 
                if (data.data.deleted == true){
                    likesCount -= 1;
                }else{
                    likesCount += 1;
                }
                $(self).attr('data-likes', likesCount);
                $(self).html(`<i class="bi bi-heart-fill"></i><span>&nbsp;${likesCount}</span>`);

                // Color change of Likes on toggle:
                if (likesCount === 0) {
                    // faded black color (adjust class name as needed)
                    $(self).addClass('text-black-50');
                } else {
                    // highlight color (e.g., red heart)
                    $(self).removeClass('text-black-50');
                }
            })
            .fail(function(errData) {
                
            });  
            
  
        });
    }
}
