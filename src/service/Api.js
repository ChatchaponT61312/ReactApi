import axios from 'axios'

export function getUser() {
    return new Promise(resolve => {
        let url = "https://disease.sh/v3/covid-19/historical?lastdays=90"
        axios.get(url).then(res => {
            resolve(res)
        }).catch(() => {
            resolve(false)
        })
    })
}