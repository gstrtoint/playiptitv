/**
 * Created by Gilmar N. Lima on 18/01/17.
 */
appplay.service('$permissao',function () {
    var permissao = {};
    function set(perm) {
        permissao = perm;
    }
    function get() {
        return permissao;
    }

    return {
        set: set,
        get: get
    }
});
