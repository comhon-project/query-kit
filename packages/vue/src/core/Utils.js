
class Utils {

    constructor()
    {
        this.uniqueId = 0;
    }

    getUniqueId()
    {
        return ++this.uniqueId;
    }

}
    
export default new Utils();