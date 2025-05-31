// Let's implement this via classes

// this class would be initialized for every post on the page
// 1. When the page loads
// 2. Creation of every post dynamically via AJAX

class PostComments{
    // constructor is used to initialize the instance of the class whenever a new instance is created
    constructor(postId){
        this.postId = postId;
        this.postContainer = $(`#post-${postId}`);
        this.newCommentForm = $(`#post-${postId}-comments-form`);
        this.createComment(postId);

        let self = this;
        // call for all the existing comments
        $('.delete-comment-button', this.postContainer).each(function(){
            self.deleteComment($(this));
        });
    }


    createComment(postId){
        let pSelf = this;
        this.newCommentForm.submit(function(e){
            e.preventDefault();
            let self = this;
            $.ajax({
                type: 'post',
                url: '/comments/create',
                data: $(self).serialize(),
                success: function(data){
                    let newComment = pSelf.newCommentDom(data.data.comment,data.data.user.name);
                    $(`#post-comments-${postId}`).prepend(newComment);
                    $(`#post-${postId}-comments-form`).trigger("reset");
                    pSelf.deleteComment($('.delete-comment-button', newComment));
                    // CHANGE:: enable the functionality of the toggle like button on the new comment
                    new ToggleLike($(' .toggle-like-button') , newComment);

                    new Noty({
                        theme: 'relax',
                        text: "Comment published!",
                        type: 'success',
                        layout: 'topRight',
                        timeout: 1500
                    }).show();

                }, error: function(error){
                    
                }
            });
        });
    }

    newCommentDom(comment,comment_user_name) {
        const likeCount   = comment.likes.length || 0;
        const likeClass   = likeCount === 0 ? 'text-black-50' : '';
        const commentHTML = `
            <li id="comment-${comment._id}"
                class="comment border rounded px-3 py-2 mb-2 shadow-sm position-relative">

            <!-- Like toggle (bottom-left) -->
            <a href="/likes/toggle/?id=${comment._id}&type=Comment"
                class="toggle-like-button like-button ${likeClass}
                        position-absolute bottom-0 start-0 ps-3 pb-1 d-flex align-items-center"
                data-likes="${likeCount}">
                <i class="bi bi-heart-fill me-1"></i>
                <span>${likeCount}</span>
            </a>

            <!-- Delete button (top-right) -->
            <a href="/comments/destroy/${comment._id}"
                class="delete-comment-button position-absolute top-0 end-0 mt-1 me-2">
                <i class="bi bi-trash-fill"></i>
            </a>

            <!-- Comment text -->
            <p class="mb-1">${comment.content}</p>

            <!-- Author -->
            <div class="small text-muted fst-italic"
                    style="padding-left: 1rem; padding-bottom: 1.5rem;">
                — ${comment_user_name}
            </div>
            </li>`;

        return $(commentHTML);
    }

    deleteComment(deleteLink){
        $(deleteLink).click(function(e){
            e.preventDefault();

            $.ajax({
                type: 'get',
                url: $(deleteLink).prop('href'),
                success: function(data){
                    $(`#comment-${data.data.comment_id}`).remove();

                    new Noty({
                        theme: 'relax',
                        text: "Comment Deleted",
                        type: 'success',
                        layout: 'topRight',
                        timeout: 1500
                        
                    }).show();
                },error: function(error){
                    
                }
            });

        });
    }
}

// // attach PostComments to every post that is already in the DOM
// $(document).ready(function () {
//   // every comment-form carries id="post-<postId>-comments-form"
//   $('form[id$="-comments-form"]').each(function () {
//     const formId = $(this).attr('id');            // e.g. "post-64fb...-comments-form"
//     const postId = formId.split('-')[1];          
//     new PostComments(postId);                     // ctor now runs → AJAX hijack
//   });
// });

// ← invoking comment constructor for all posts rendered by server to dynamically add comment on this post
// so Every existing comment form gets a submit handler when the page loads :- 
$(function () {
  $('form[id$="-comments-form"]').each((_, f) => new PostComments(f.id.split('-')[1]));
});

