import { Component, OnInit } from '@angular/core';

@Component({
	selector: 'landing-page',
	templateUrl: './landing-page.component.html',
	styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent implements OnInit {

	supporters: any[] = [];
	contributors: any[] = [];
	constructor() { 
		// Supporters are being added manually since buymeacoffee API leaks e-mail address/sensitive info and I have no backend to process it for me :/
		this.supporters.push({name: "Sean Cline", amount: "15", imgUrl: "https://img.buymeacoffee.com/api/?name=Sean+Cline&size=300&bg-image=bmc&background=FF813F"});
		this.supporters.push({name: "Sunny Beatteay", amount: "15", imgUrl: "https://img.buymeacoffee.com/api/?name=Sunny+Beatteay&size=300&bg-image=bmc&background=FF813F"});
	
		// Get contributors from GitHub API
		try{
			fetch("https://api.github.com/repos/honzaap/systemizer/contributors")
			.then(res => res.json().then(data => {
				if(!Array.isArray(data))
					return;
				data.forEach(contributor => {
					this.contributors.push({
						name: contributor.login,
						imgUrl: contributor.avatar_url,
						link: contributor.html_url
					})
				})
			}))
		}
		catch{ }
	}

	ngOnInit(): void {
		document.getElementsByClassName("page")[0].scrollTop = 0;
	}

	scaleFontSize(name){
		return Math.min(240/name.length, 19) + 'px';
	}
}
